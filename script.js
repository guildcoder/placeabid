// Load the Google Visualization API
google.charts.load('current', {'packages':['table']});

let lotListings = [];
let lotImages = {};
let bidBoard = {};

const sheetToJSON = (sheetName) => `https://docs.google.com/spreadsheets/d/1tvE1IDZKQLje2K64Et0nQy0jTlOcnLOPma6Ys_ZWciI/gviz/tq?tqx=out:json&sheet=${sheetName}`;

async function fetchSheetData(sheetName) {
    const response = await fetch(sheetToJSON(sheetName));
    const text = await response.text();
    const json = JSON.parse(text.substring(47, text.length-2));
    return json.table.rows;
}

async function initializeData() {
    // Load Sale Lots
    const lotRows = await fetchSheetData('Lot Listings');
    lotRows.forEach(row => {
        const lot = row.c[0]?.v;
        const url = row.c[1]?.v;
        if (lot) {
            lotListings.push(lot);
            lotImages[lot] = url;
        }
    });

    // Load Bid Board
    const bidRows = await fetchSheetData('Bid Board');
    bidRows.forEach(row => {
        const lot = row.c[0]?.v;
        const currentBid = row.c[1]?.v;
        if (lot) {
            bidBoard[lot] = currentBid || 0;
        }
    });

    populateSaleLots();
}

function populateSaleLots() {
    const select = document.getElementById('saleLot');
    lotListings.forEach(lot => {
        const option = document.createElement('option');
        option.value = lot;
        option.textContent = lot;
        select.appendChild(option);
    });
}

function updateImage() {
    const lot = document.getElementById('saleLot').value;
    const imgUrl = lotImages[lot];
    const img = document.getElementById('saleImage');
    if (imgUrl) {
        img.src = imgUrl;
        img.style.display = 'block';
    } else {
        img.style.display = 'none';
    }

    const currentBid = bidBoard[lot] || 0;
    const bidInput = document.getElementById('bidAmount');
    const prompt = document.getElementById('bidPrompt');
    if (currentBid < 400) {
        bidInput.value = 400;
        prompt.textContent = "You are placing the opening bid. Minimum starting bid is $400.";
    } else {
        bidInput.value = currentBid + 100;
        prompt.textContent = `Current bid is $${currentBid}. Your bid is autofilled $100 above.`;
    }
}

function clearErrors() {
    document.getElementById('saleLotError').textContent = '';
    document.getElementById('bidError').textContent = '';
}

function validateForm() {
    clearErrors();
    let valid = true;

    const lot = document.getElementById('saleLot').value;
    const bid = parseInt(document.getElementById('bidAmount').value);
    const currentBid = bidBoard[lot] || 0;

    if (!lot) {
        document.getElementById('saleLotError').t
