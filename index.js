const rowsPerPage = 100;
let currentPage = 1;
let data = [];
let filteredData = [];
let headers = [];
let visibleHeaders = [];

function toggleSpinner(show) {
    document.getElementById("spinner").style.display = show ? "block" : "none";
}

function toggleNoResults(show) {
    document.getElementById("no-results").style.display = show ? "block" : "none";
}

function updateColumnSelector() {
    const selector = document.getElementById("column-selector");
    selector.innerHTML = "";
    visibleHeaders = [...headers];

    headers.forEach((header, index) => {
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = true;
        checkbox.dataset.index = index;
        checkbox.className = "form-check-input me-2";
        checkbox.id = "col-" + index;

        checkbox.addEventListener("change", (e) => {
            const idx = parseInt(e.target.dataset.index);
            if (e.target.checked) {
                if (!visibleHeaders.includes(headers[idx])) {
                    visibleHeaders.push(headers[idx]);
                }
            } else {
                visibleHeaders = visibleHeaders.filter(h => h !== headers[idx]);
            }
            buildTableFromData(currentPage);
        });

        const label = document.createElement("label");
        label.className = "form-check-label d-flex align-items-center mb-1";
        label.setAttribute("for", "col-" + index);
        label.appendChild(checkbox);
        label.append(header);

        selector.appendChild(label);
    });

    // Enable dropdown
    document.getElementById("columnDropdown").disabled = false;
}

function buildTableFromData(page = 1) {
    const dataToDisplay = filteredData.length > 0 ? filteredData : data;
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const pagedData = dataToDisplay.slice(start, end);

    if (pagedData.length === 0) {
        toggleNoResults(true);
        document.getElementById("table-container").innerHTML = "";
        return;
    } else {
        toggleNoResults(false);
    }

    const table = document.createElement("table");
    table.className = "table table-bordered table-sm";

    const headerRow = document.createElement("tr");
    const rowHeader = document.createElement("th");
    rowHeader.textContent = "Row";
    headerRow.appendChild(rowHeader);

    headers.forEach((cell, index) => {
        if (visibleHeaders.includes(cell)) {
            const th = document.createElement("th");
            th.textContent = cell;
            headerRow.appendChild(th);
        }
    });
    table.appendChild(headerRow);

    pagedData.forEach((row, index) => {
        const tr = document.createElement("tr");
        const tdRowNumber = document.createElement("td");
        tdRowNumber.textContent = start + index + 1;
        tr.appendChild(tdRowNumber);

        row.forEach((cell, colIdx) => {
            if (visibleHeaders.includes(headers[colIdx])) {
                const td = document.createElement("td");
                td.textContent = typeof cell === "string" ? cell : String(cell || "");
                tr.appendChild(td);
            }
        });

        table.appendChild(tr);
    });

    document.getElementById("table-container").innerHTML = "";
    document.getElementById("table-container").appendChild(table);
    buildPagination();
}

function buildPagination() {
    const dataToDisplay = filteredData.length > 0 ? filteredData : data;
    const totalPages = Math.ceil(dataToDisplay.length / rowsPerPage);
    let paginationHTML = "";

    if (currentPage > 1) {
        paginationHTML += `<button class="btn btn-primary me-2" onclick="changePage(${currentPage - 1})">Previous</button>`;
    }

    paginationHTML += `<span> Page ${currentPage} of ${totalPages} </span>`;

    if (currentPage < totalPages) {
        paginationHTML += `<button class="btn btn-primary ms-2" onclick="changePage(${currentPage + 1})">Next</button>`;
    }

    document.getElementById("pagination").innerHTML = paginationHTML;
}

function changePage(page) {
    currentPage = page;
    buildTableFromData(currentPage);
}

function filterTable() {
    const input = $('#search-input').val().toLowerCase().trim();
    const keywords = input.split(/\s+/);

    filteredData = data.filter(row =>
        keywords.every(keyword =>
            row.join(' ').toLowerCase().includes(keyword)
        )
    );

    currentPage = 1;

    if (filteredData.length === 0) {
        toggleNoResults(true);
        document.getElementById("table-container").innerHTML = "";
        document.getElementById("pagination").innerHTML = "";
    } else {
        toggleNoResults(false);
        buildTableFromData(currentPage);
    }
}


function resetTable() {
    $('#search-input').val('');
    filteredData = [];
    currentPage = 1;
    buildTableFromData(currentPage);
}

$('#excel-file').on('change', function (e) {
    toggleSpinner(true);
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const dataBinary = new Uint8Array(e.target.result);
        const workbook = XLSX.read(dataBinary, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length > 1) {
            headers = jsonData[0];
            data = jsonData.slice(1);
            filteredData = [];
            currentPage = 1;
            updateColumnSelector();
            buildTableFromData();
        }
        toggleSpinner(false);
    };
    reader.readAsArrayBuffer(file);
});

$('#search-btn').on('click', function () {
    toggleSpinner(true);
    filterTable();
    toggleSpinner(false);
});

$('#reset-btn').on('click', function () {
    toggleSpinner(true);
    resetTable();
    toggleSpinner(false);
});
