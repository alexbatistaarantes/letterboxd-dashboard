const dataInput = document.querySelector("#data-input");
const buttonCreateDashboard = document.querySelector("#create-dashboard-button");
const filesList = document.querySelector("#files-list");

let dataframes = {};
let statistics = {};
const currentYear = 2023;

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
    writeDFToTable(statistics['moviesWatchedByWatchedYear'], document.querySelector("div#movies-watched-by-watched-year > table"));

    /* Movies by Year */
    writeSeriesToTable(statistics['moviesWatchedByYear'], document.querySelector("div#movies-watched-by-year > table"));
}

/* Get Statistics */
function getStatistics(){
    /* Movies Watched */
    statistics['moviesWatched'] = dataframes.watched.Name.count();
    
    /* Movies watched this year */
    statistics['moviesWatchedThisYear'] = dataframes.diary.loc({rows: dataframes.diary['Watched Date'].str.startsWith(`${currentYear}`)}).shape[0];
    
    /* Movies by year watched */
    const diaryEntryYears = dataframes.diary["Watched Date"].str.slice(0,4);
    const moviesWatchedByWatchedYear_Series = diaryEntryYears.valueCounts();
    statistics['moviesWatchedByWatchedYear'] = new dfd.DataFrame({'Year':  moviesWatchedByWatchedYear_Series.index, 'Quantity': moviesWatchedByWatchedYear_Series.values}).sortValues('Year', {ascending: false});
    
    /* Movies by Year */
    statistics['moviesWatchedByYear'] = dataframes.watched.Year.valueCounts().sortValues({ascending: false});
}

/* Get movies watched */
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
