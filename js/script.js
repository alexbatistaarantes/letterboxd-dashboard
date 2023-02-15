const currentYear = new Date().getFullYear();

const dataInput = document.querySelector("#data-input");

const buttonCreateDashboard = document.querySelector("#create-dashboard-button");
const unhideButtonCreateDashboard = () => dataInput.value && buttonCreateDashboard.classList.remove('hidden');
window.addEventListener('load', () => unhideButtonCreateDashboard() );
dataInput.addEventListener('change', () => unhideButtonCreateDashboard() );

let dataframes;
let statistics;

/* Triggers reading files and creating dashboard */
buttonCreateDashboard.addEventListener('click', createDashboard);

async function createDashboard() {
    
    dataframes = {};
    statistics = {};

    await getData();
    
    preprocessData();

    getStatistics();
    
    writeToDashboard();

    /* Remove .hidden from dashboard */
    document.querySelector("div#dashboard").classList.remove('hidden');
};

/* Write to dashboard */
function writeToDashboard(){
    /* Movies Watched */
    writeContentToElement(statistics.moviesWatched, document.querySelector("div#movies-watched > p"));

    /* Movies watched this year */
    writeContentToElement(statistics['moviesWatchedThisYear'], document.querySelector("div#movies-watched-this-year > p"));

    /* Movies watched by watched year */
    writeDFToTable(statistics['moviesWatchedByYear'], document.querySelector("div#movies-watched-by-year > table"));

    /* Movies by Release Year */
    writeSeriesToTable(statistics['moviesWatchedByReleaseYear'], document.querySelector("div#movies-watched-by-release-year > table"));
}

/* Get Statistics */
function getStatistics(){
    /* Movies Watched */
    statistics['moviesWatched'] = dataframes.watched.Name.count();
    
    /* Movies watched this year */
    statistics['moviesWatchedThisYear'] = dataframes.diary.loc({rows: dataframes.diary['Watched Year'].eq(currentYear.toString())}).shape[0];
    
    /* Movies by year watched */
    const moviesWatchedByYear = dataframes.diary["Watched Year"].valueCounts();
    statistics['moviesWatchedByYear'] = new dfd.DataFrame({'Year':  moviesWatchedByYear.index, 'Quantity': moviesWatchedByYear.values}).sortValues('Year', {ascending: false});
    
    /* Movies by Release Year */
    statistics['moviesWatchedByReleaseYear'] = dataframes.watched.Year.valueCounts().sortValues({ascending: false});

    /* Movies by Last Year Months (plot) */
    statistics['moviesWatchedByMonthYear'] = dataframes.diary.loc({rows: dataframes.diary['Watched Year'].eq((currentYear-1).toString())})['Watched Month'].valueCounts();
    statistics['moviesWatchedByMonthYear'].plot("movies-watched-by-month-last-year-timeline").bar();
}

function preprocessData() {
    /* Create separate watched Month and Year columns in diary */
    dataframes.diary.addColumn(
        'Watched Year',
        dataframes.diary['Watched Date'].str.slice(0, 4),
        {inplace: true}
    );
    dataframes.diary.addColumn(
        'Watched Month',
        dataframes.diary['Watched Date'].str.slice(5, 7),
        {inplace: true}
    );
}

async function getData() {
    const files = await getFilesFromZip(dataInput);

    dataframes['watched'] = await getDataframeFromCSV(files.filter((file) => file.filename === "watched.csv")[0]);
    dataframes['diary'] = await getDataframeFromCSV(files.filter((file) => file.filename === "diary.csv")[0]);
    dataframes['ratings'] = await getDataframeFromCSV(files.filter((file) => file.filename === "ratings.csv")[0]);
    dataframes['watchlist'] = await getDataframeFromCSV(files.filter((file) => file.filename === "watchlist.csv")[0]);
}
