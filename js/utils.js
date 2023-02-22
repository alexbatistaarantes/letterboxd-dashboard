/* Load table to Dataframe */
async function getDataframeFromCSV(file){

    let blobWriter = new zip.BlobWriter();

    let df = dfd.readCSV(await file.getData(blobWriter))
    .then((df) => {
        return df;
    });

    return df;

    //const reader = new FileReader();
    //let textWriter = new zip.TextWriter();
    //const content = await dataFile.getData(textWriter);
}

/* Get files from a .zip */
async function getFilesFromZip(input) {
    const zipFile = new zip.ZipReader(new zip.BlobReader( input.files[0] ));
    const files = await zipFile.getEntries();

    return files;
}
