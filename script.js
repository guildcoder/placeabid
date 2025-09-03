// Load the Google Visualization API
google.charts.load('current', {'packages':['table']});

// Spreadsheet URL
const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/1tvE1IDZKQLje2K64Et0nQy0jTlOcnLOPma6Ys_ZWciI/edit?usp=sharing';

let lotListings = [];
let lotImages = {};
let nameToBidNumber = {};
let bidBoard = {};

// Convert Google Sheets to JSON-friendly URL
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

    // Load Names and Bidding Numbers
    const bidderRows = await fetchSheetData('Bidding Number');
    bidderRows.forEach(row => {
        const name = row.c[0]?.v;
        const bidNum = row.c[3]?.v;
        if (name && bidNum) {
            nameToBidNumber[name] = bidNum;
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

    // Update bid
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

function validateForm() {
    const name = document.getElementById('bidderName').value.trim();
    const bidNumber = document.getElementById('biddingNumber').value.trim();
    const lot = document.getElementById('saleLot').value;
    const bid = parseInt(document.getElementById('bidAmount').value);

    if (!(name in nameToBidNumber)) {
        alert("Name is invalid or not found in records.");
        return false;
    }

    if (bidNumber !== nameToBidNumber[name]) {
        alert("Bidding number does not match name.");
        return false;
    }

    const currentBid = bidBoard[lot] || 0;
    if (bid < 400 || (bid <= currentBid)) {
        alert("Bid must be at least $400 and greater than current bid.");
        return false;
    }

    if (bid % 100 !== 0) {
        alert("Bid must be in increments of $100.");
        return false;
    }

    return true;
}

function submitForm() {
    if (!validateForm()) return;

    const formData = new FormData();
    formData.append("entry.1393425854", document.getElementById('saleLot').value);
    formData.append("entry.2014194198", document.getElementById('bidderName').value.trim());
    formData.append("entry.938652901", document.getElementById('biddingNumber').value.trim());
    formData.append("entry.849028228", document.getElementById('bidAmount').value);

    fetch("https://docs.google.com/forms/d/e/1FAIpQLSeyHGovAvqCszajtXfqdgOGNya0qTfxzhNTxMnsr5b03x6tJA/formResponse", {
        method: "POST",
        body: formData
    }).then(() => {
        alert("Bid submitted successfully!");
        document.getElementById('bidForm').reset();
        document.getElementById('saleImage').style.display = 'none';
    }).catch(err => {
        alert("Error submitting form. Try again.");
        console.error(err);
    });
}

window.onload = initializeData;
