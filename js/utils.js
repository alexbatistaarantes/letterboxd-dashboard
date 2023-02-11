function writeContentToElement(element, content){
    element.textContent = content;
}

/* Write a dataframe to a table */
function writeDFToTable(df, table){

    const tbody = table.querySelector("tbody");

    for(let rowIndex = 0; rowIndex < df.shape[0]; rowIndex++){
        const tr = document.createElement("tr");
        
        const values = df.iloc({rows: [rowIndex]}).values[0];
        for(let columnIndex = 0; columnIndex < values.length; columnIndex++){
            const tdValue = document.createElement("td");
            tdValue.textContent = values[columnIndex];
            tr.appendChild(tdValue);
        }

        tbody.appendChild(tr);
    }
}

/* Write a Series to a table */
function writeSeriesToTable(series, table){

    const tbody = table.querySelector("tbody");

    for(let rowIndex = 0; rowIndex < series.shape[0]; rowIndex++){
        const tr = document.createElement("tr");
        
        const tdIndex = document.createElement("td");
        tdIndex.textContent = series.iloc([rowIndex]).index[0];
        tr.appendChild(tdIndex);

        const tdValue = document.createElement("td");
        tdValue.textContent = series.iloc([rowIndex]).values[0];
        tr.appendChild(tdValue);

        tbody.appendChild(tr);
    }
}