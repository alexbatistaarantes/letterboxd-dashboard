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
            observation.classList.push("observation");
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
        title.textContent = this.title;
        plot.id = `${this.id}_plot`;
    
        div.appendChild(title);
        div.appendChild(plot);
    
        if(this.observation){
            const observation = document.createElement('p');
            observation.classList.push("observation");
            observation.textContent = this.observation;
            div.appendChild(observation);
        }
    
        return div;
    }
}

class LetterboxdDashboard {
    constructor(div, watched, diary, ratings, watchlist){
        this.div = div;

        this.watched = watched;
        this.diary = diary;
        this.ratings = ratings;
        this.watchlist = watchlist;

        this.elements = [];

        this.preprocessData();
    }

    preprocessData(){
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

        /* Movies by Last Year Months (plot) */
        const moviesWatchedByMonthLastYear = this.diary.loc({rows: this.diary['Watched Year'].eq((currentYear-1).toString())})['Watched Month'].valueCounts();
        this.elements.push( new PlotElement("Movies watched by month last year", moviesWatchedByMonthLastYear, 'movies-watched-by-month-last-year', "bar") );

        //this.statistics['moviesRuntime'] = dfd.merge(({"left": this.watched, "right": imdb, "on": ["Name", "Year"], how: "inner"}));
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

async function createDashboard() {

    const dataframes = await getData();
    
    const dashboardDiv = document.querySelector("div#dashboard");

    lbDashboard = new LetterboxdDashboard(
        dashboardDiv,
        dataframes.watched,
        dataframes.diary,
        dataframes.ratings,
        dataframes.watchlist
    );
    lbDashboard.getElements();
    lbDashboard.writeElements();

    /* Remove .hidden from dashboard */
    dashboardDiv.classList.remove('hidden');
};

async function getData() {
    const files = await getFilesFromZip(dataInput);

    let dataframes = {};
    dataframes['watched'] = await getDataframeFromCSV(files.filter((file) => file.filename === "watched.csv")[0]);
    dataframes['diary'] = await getDataframeFromCSV(files.filter((file) => file.filename === "diary.csv")[0]);
    dataframes['ratings'] = await getDataframeFromCSV(files.filter((file) => file.filename === "ratings.csv")[0]);
    dataframes['watchlist'] = await getDataframeFromCSV(files.filter((file) => file.filename === "watchlist.csv")[0]);
    return dataframes;
}

async function loadImdb() {
    imdb = await dfd.readCSV("https://raw.githubusercontent.com/alexbatistaarantes/letterboxd-dashboard/main/imdb.tsv", {delimiter: "\t"}).then(df => {return df;});
    imdb.rename({ "primaryTitle": "Name", "startYear": "Year" }, { inplace: true })
}
