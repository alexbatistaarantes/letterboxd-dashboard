const dataInput = document.querySelector("#data-input");
const buttonCreateDashboard = document.querySelector("#create-dashboard-button");
const filesList = document.querySelector("#files-list");

let dataframes = {};
let statistics = {};

/* Triggers reading files and creating dashboard */
buttonCreateDashboard.addEventListener('click', async () => {
    await loadDataFiles();
    getStatistics();
    writeDashboard();
});

/* Write to dashboard */
function writeDashboard(){
    document.querySelector("div#movies-watched > p").textContent = statistics.moviesWatched;
}

/* Get Statistics */
function getStatistics(){
    statistics['moviesWatched'] = dataframes.watched.Name.count();
    statistics['moviesWatchedByYear'] = dataframes.watched.Year.valueCounts().sortValues({ascending: false});
}

/* Write a dataframe to a table */
function writeDFToTable(df, table){
    ;
}

/* Write a Series to a table */
function writeSeriesToTable(series, table){
    ;
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
    files['watched'] = filesList.filter((file) => file.filename === "watched.csv")[0];
    await loadTable(files['watched'], 'watched');
    files['ratings'] = filesList.filter((file) => file.filename === "ratings.csv")[0];
    await loadTable(files['ratings'], 'ratings');
    files['diary'] = filesList.filter((file) => file.filename === "diary.csv")[0];
    await loadTable(files['diary'], 'ratings');
    files['watchlist'] = filesList.filter((file) => file.filename === "watchlist.csv")[0];
    await loadTable(files['watchlist'], 'watchlist');
}
