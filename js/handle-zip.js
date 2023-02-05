const dataInput = document.querySelector("#data-input");
const buttonCreateDashboard = document.querySelector("#create-dashboard-button");
const filesList = document.querySelector("#files-list");

let files = {
    'watched': null,
    'ratings': null,
    'diary': null,
    'watchlist': null
};

/* Create Dashboard */
buttonCreateDashboard.addEventListener('click', async () => {
    await loadDataFiles();
    console.log(files);
    getMoviesWatched();
});

/* Get movies watched */
async function getMoviesWatched(){
    const reader = new FileReader();

    let textWriter = new zip.TextWriter();

    //reader.readAsText(await files['watched'].getData(textWriter))
    const content = await files['watched'].getData(textWriter);
    console.log(content);
}

/* Get data files from zip */
async function loadDataFiles() {
    const zipFile = new zip.ZipReader(new zip.BlobReader( dataInput.files[0] ));
    const filesList = await zipFile.getEntries();
    
    files['watched'] = filesList.filter((file) => file.filename === "watched.csv")[0];
    files['ratings'] = filesList.filter((file) => file.filename === "ratings.csv")[0];
    files['diary'] = filesList.filter((file) => file.filename === "diary.csv")[0];
    files['watchlist'] = filesList.filter((file) => file.filename === "watchlist.csv")[0];
}
