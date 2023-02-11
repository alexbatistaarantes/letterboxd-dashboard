const dataInput = document.querySelector("#data-input");
const filesList = document.querySelector("#files-list");

const buttonCreateDashboard = document.querySelector("#create-dashboard-button");
const unhideButtonCreateDashboard = () => dataInput.value && buttonCreateDashboard.classList.remove('hidden');
window.addEventListener('load', () => unhideButtonCreateDashboard() );
dataInput.addEventListener('change', () => unhideButtonCreateDashboard() );

let dataframes = {};
let statistics = {};
const currentYear = new Date().getFullYear();

/* Triggers reading files and creating dashboard */
buttonCreateDashboard.addEventListener('click', async () => {
    await loadDataFiles();
    
    getStatistics();
    
    writeDashboard();

    /* Remove .hidden from dashboard */
    document.querySelector("div#dashboard").classList.remove('hidden');
});

/* Write to dashboard */
function writeDashboard(){
    /* Movies Watched */
    writeContentToElement(document.querySelector("div#movies-watched > p"), statistics.moviesWatched);

    /* Movies watched this year */
    writeContentToElement(document.querySelector("div#movies-watched-this-year > p"), statistics['moviesWatchedThisYear']);

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
    statistics['moviesWatchedThisYear'] = dataframes.diary.loc({rows: dataframes.diary['Watched Date'].str.startsWith(`${currentYear}`)}).shape[0];
    
    /* Movies by year watched */
    const diaryEntryYears = dataframes.diary["Watched Date"].str.slice(0,4);
    const moviesWatchedByYear_Series = diaryEntryYears.valueCounts();
    statistics['moviesWatchedByYear'] = new dfd.DataFrame({'Year':  moviesWatchedByYear_Series.index, 'Quantity': moviesWatchedByYear_Series.values}).sortValues('Year', {ascending: false});
    
    /* Movies by Year */
    statistics['moviesWatchedByReleaseYear'] = dataframes.watched.Year.valueCounts().sortValues({ascending: false});
}

/* Load table to Dataframe */
async function loadTable(dataFile, key){
    let blobWriter = new zip.BlobWriter();
    dfd.readCSV(await dataFile.getData(blobWriter))
    .then((df) => {
        dataframes[key] = df;
    })
    //const reader = new FileReader();
    //let textWriter = new zip.TextWriter();
    //const content = await dataFile.getData(textWriter);
}

/* Get data files from zip */
async function loadDataFiles() {
    const zipFile = new zip.ZipReader(new zip.BlobReader( dataInput.files[0] ));
    const filesList = await zipFile.getEntries();
    
    let files = {};
    const watchedFile = filesList.filter((file) => file.filename === "watched.csv")[0];
    await loadTable(watchedFile, 'watched');
    const ratings = filesList.filter((file) => file.filename === "ratings.csv")[0];
    await loadTable(ratings, 'ratings');
    const diary = filesList.filter((file) => file.filename === "diary.csv")[0];
    await loadTable(diary, 'diary');
    const watchlist = filesList.filter((file) => file.filename === "watchlist.csv")[0];
    await loadTable(watchlist, 'watchlist');
}
