const currentYear = new Date().getFullYear();

const dataInput = document.querySelector("#data-input");

const buttonCreateDashboard = document.querySelector("#create-dashboard-button");
const unhideButtonCreateDashboard = () => dataInput.value && buttonCreateDashboard.classList.remove('hidden');
window.addEventListener('load', () => unhideButtonCreateDashboard() );
dataInput.addEventListener('change', () => unhideButtonCreateDashboard() );

/* Represents an element in the dashboard */
class DashboardElement {
    constructor(title, data, id, observation=null){
        this.title = title;
        this.data = data;
        this.id = id;
        this.observation = observation;
    }
}

/* Represents a single indicator (number or text) in the dashboard */
class IndicatorElement extends DashboardElement {

    getElementDiv(){
    
        const div = document.createElement('div');
        const title = document.createElement('h3');
        const value = document.createElement('p');
    
        div.id = this.id;
        title.textContent = this.title;
        value.textContent = this.data;
    
        div.appendChild(title);
        div.appendChild(value);
    
        if(this.observation){
            const observation = document.createElement('p');
            observation.classList.add("observation");
            observation.textContent = this.observation;
            div.appendChild(observation);
        }
    
        return div;
    }
}

/* Represents a table in the dashboard */
class TableElement extends DashboardElement {

    getElementDiv(){

        const div = document.createElement('div');
        const title = document.createElement('h3');
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const trHead = document.createElement('tr');
        const tbody = document.createElement('tbody');
        
        div.id = this.id;
        title.textContent = this.title;

        /* Inserting Header */
        this.data.columns.forEach(column => {
            const th= document.createElement('th');
            th.textContent = column;
            trHead.appendChild(th);
        })
        thead.appendChild(trHead);
        table.appendChild(thead);
        
        /* Inserting Body */
        for(let rowIndex = 0; rowIndex < this.data.shape[0]; rowIndex++){
            const tr = document.createElement("tr");
            
            const values = this.data.iloc({rows: [rowIndex]}).values[0];
            for(let columnIndex = 0; columnIndex < values.length; columnIndex++){
                const td = document.createElement("td");
                td.textContent = values[columnIndex];
                tr.appendChild(td);
            }
            
            tbody.appendChild(tr);
        }
        table.appendChild(tbody);

        div.appendChild(title);
        div.appendChild(table);

        if(this.observation){
            const observation = document.createElement('p');
            observation.classList.add("observation");
            observation.textContent = this.observation;
            div.appendChild(observation);
        }

        return div;
    }
}

/* Represents a plot in the dashboard */
class PlotElement extends DashboardElement {

    constructor(title, data, id, type, observation=null){
        super(title, data, id, observation);
        this.type = type;
    }

    renderPlot(){
        switch(this.type.toLowerCase()){
            case 'bar':
                this.data.plot(`${this.id}_plot`).bar();
                break;
        }
    }

    getElementDiv(){
    
        const div = document.createElement('div');
        const title = document.createElement('h3');
        const plot = document.createElement('div');
    
        div.id = this.id;
        div.classList.add('plot');
        title.textContent = this.title;
        plot.id = `${this.id}_plot`;
    
        div.appendChild(title);
        div.appendChild(plot);
    
        if(this.observation){
            const observation = document.createElement('p');
            observation.classList.add("observation");
            observation.textContent = this.observation;
            div.appendChild(observation);
        }
    
        return div;
    }
}

class LetterboxdDashboard {
    constructor(div, watched, diary, ratings, genres){
        this.div = div;

        this.watched = watched;
        this.diary = diary;
        this.ratings = ratings;

        this.genres = genres;

        this.elements = [];

        this.preprocessData();
    }

    preprocessData(imdb){
        
        /* Create separate watched Month and Year columns in diary */
        this.diary.addColumn(
            'Watched Year',
            this.diary['Watched Date'].str.slice(0, 4),
            {inplace: true}
        );
        this.diary.addColumn(
            'Watched Month',
            this.diary['Watched Date'].str.slice(5, 7),
            {inplace: true}
        );
        
        /* Add runtime and IMDB ID to Letterboxdd data */
        //this.watched = dfd.merge(({"left": this.watched, "right": imdb, "on": ["Name", "Year"], how: "left"}));
        //this.diary = dfd.merge(({"left": this.diary, "right": imdb, "on": ["Name", "Year"], how: "left"}));
    }

    /* Get elements to display in the dashboard */
    getElements(){

        /* Movies Watched */
        const moviesWatched = this.watched.Name.count();
        this.elements.push( new IndicatorElement("Movies Watched", moviesWatched, 'movies-watched') );

        /* Movies watched this year */
        const moviesWatchedThisYear = this.diary.loc({rows: this.diary['Watched Year'].eq(currentYear.toString())}).shape[0];
        this.elements.push( new IndicatorElement("Movies watched this year", moviesWatchedThisYear, 'movies-watched-this-year') );

        /* Movies by year watched */
        const moviesWatchedByYear_series = this.diary["Watched Year"].valueCounts();
        const moviesWatchedByYear = new dfd.DataFrame({
            'Year':  moviesWatchedByYear_series.index,
            'Quantity': moviesWatchedByYear_series.values
        }).sortValues('Year', {ascending: false});
        this.elements.push( new TableElement("Movies watched by year", moviesWatchedByYear, 'movies-watched-by-year') );

        /* Movies by Release Year */
        const moviesWatchedByReleaseYear_series = this.watched.Year.valueCounts().sortValues({ascending: false});
        const moviesWatchedByReleaseYear = new dfd.DataFrame({
            'Release Year': moviesWatchedByReleaseYear_series.index,
            'Quantity': moviesWatchedByReleaseYear_series.values
        });
        this.elements.push( new TableElement("Movies watched by release year", moviesWatchedByReleaseYear, 'movies-watched-by-release-year') );

        /* Movies Watched by Genre */
        const moviesWatchedByGenre_series = this.genres.Genre.valueCounts().sortValues({ascending: false});
        const moviesWatchedByGenre = new dfd.DataFrame({
            'Genre': moviesWatchedByGenre_series.index,
            'Quantity': moviesWatchedByGenre_series.values
        });
        this.elements.push( new TableElement("Movies watched by genre", moviesWatchedByGenre, 'movies-watched-by-genre', "A movie usually have more than one gender") );

        /* Movies by Last Year Months (plot) */
        const moviesWatchedByMonthLastYear = this.diary.loc({rows: this.diary['Watched Year'].eq((currentYear-1).toString())})['Watched Month'].valueCounts();
        this.elements.push( new PlotElement("Movies watched by month last year", moviesWatchedByMonthLastYear, 'movies-watched-by-month-last-year', "bar") );
    }

    /* Write elements to the dashboard div */
    writeElements(){
        this.elements.forEach((element) => {
            const elementDiv = element.getElementDiv();
            this.div.appendChild(elementDiv);

            if(element instanceof PlotElement){
                element.renderPlot();
            }
        })
    }
}

/* Triggers reading files and creating dashboard */
buttonCreateDashboard.addEventListener('click', createDashboard);

let lbDashboard;
let imdb;
let imdb_movie_genres;

async function createDashboard() {

    buttonCreateDashboard.disabled = true;

    let dataframes = await getData();
    dataframes = await mergeImdbData(dataframes);
    
    const dashboardDiv = document.querySelector("div#dashboard");

    lbDashboard = new LetterboxdDashboard(
        dashboardDiv,
        dataframes.watched,
        dataframes.diary,
        dataframes.ratings,
        dataframes.genres
    );
    lbDashboard.getElements();
    lbDashboard.writeElements();
    
    buttonCreateDashboard.disabled = false;

    /* Remove .hidden from dashboard */
    dashboardDiv.classList.remove('hidden');
};

async function getData() {
    const files = await getFilesFromZip(dataInput);

    let dataframes = {};
    dataframes['watched'] = await getDataframeFromCSV(files.filter((file) => file.filename === "watched.csv")[0]);
    dataframes['diary'] = await getDataframeFromCSV(files.filter((file) => file.filename === "diary.csv")[0]);
    dataframes['ratings'] = await getDataframeFromCSV(files.filter((file) => file.filename === "ratings.csv")[0]);
    return dataframes;
}

async function mergeImdbData(dataframes) {
    const siteUrl = window.location.href;
    
    /* Get info for movies in IMDB */
    let imdb = await dfd.readCSV(`${siteUrl}imdb.tsv`, {delimiter: "\t"}).then(df => {return df;});
    imdb.rename({ "tconst": "Id", "primaryTitle": "Name", "startYear": "Year" }, { inplace: true });
    /* Genres of the movies */
    const movie_genres = await dfd.readCSV(`${siteUrl}imdb_movies_genres.csv`, {delimiter: ","}).then(df => {return df;});
    movie_genres.rename({ "tconst": "Id", "genres": "Genre" }, { inplace: true });

    /* Adding more informations about the movies */
    /* TODO: new column with title in lower case, and maybe without non-letter and non-digits, to better match IMDB titles */
    dataframes.watched = dfd.merge({left: dataframes.watched, right: imdb, on: ['Name', 'Year'], how: 'left'});
    dataframes.diary.addColumn('Id', dfd.merge({left: dataframes.diary, right: dataframes.watched, on: ['Name', 'Year'], how: 'left'}).Id, {inplace: true});
    dataframes.genres = dfd.merge({left: dataframes.watched, right: movie_genres, on: ['Id'], how: 'inner'}).loc({columns: ['Id', 'Genre']});

    return dataframes;
}
