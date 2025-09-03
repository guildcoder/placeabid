// Load the Google Visualization API
google.charts.load('current', {'packages':['table']});

// Spreadsheet URL
const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/1tvE1IDZKQLje2K64Et0nQy0jTlOcnLOPma6Ys_ZWciI/edit?usp=sharing';

let lotListings = [];
let lotImages = {};
let nameToBidNumber = {};
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
    document.getElementById('nameError').textContent = '';
    document.getElementById('bidNumberError').textContent = '';
    document.getElementById('bidError').textContent = '';
}

function validateForm() {
    clearErrors();
    let valid = true;

    const name = document.getElementById('bidderName').value.trim();
    const bidNumber = document.getElementById('biddingNumber').value.trim();
    const lot = document.getElementById('saleLot').value;
    const bid = parseInt(document.getElementById('bidAmount').value);

    if (!lot) {
        document.getElementById('saleLotError').textContent = "Please select a Sale Lot.";
        valid = false;
    }

    const currentBid = bidBoard[lot] || 0;
    if (bid < 400 || bid <= currentBid) {
        document.getElementById('bidError').textContent = "Bid must be at least $400 and greater than current bid.";
        valid = false;
    }

    if (bid % 100 !== 0) {
        document.getElementById('bidError').textContent = "Bid must be in increments of $100.";
        valid = false;
    }

    return valid;
}

function submitForm() {
    if (!validateForm()) return;

    // Create a temporary form to submit to Google Form
    const tempForm = document.createElement('form');
    tempForm.action = "https://docs.google.com/forms/d/e/1FAIpQLSeyHGovAvqCszajtXfqdgOGNya0qTfxzhNTxMnsr5b03x6tJA/formResponse";
    tempForm.method = "POST";
    tempForm.target = "hidden_iframe";

    const fields = {
        "entry.1393425854": document.getElementById('saleLot').value,
        "entry.2014194198": document.getElementById('bidderName').value.trim(),
        "entry.938652901": document.getElementById('biddingNumber').value.trim(),
        "entry.849028228": document.getElementById('bidAmount').value
    };

    for (const key in fields) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = fields[key];
        tempForm.appendChild(input);
    }

    // Add a hidden iframe to prevent page reload
    const iframe = document.createElement('iframe');
    iframe.name = "hidden_iframe";
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    document.body.appendChild(tempForm);
    tempForm.submit();

    // Clean up
    tempForm.remove();
    iframe.remove();
    document.getElementById('bidForm').reset();
    document.getElementById('saleImage').style.display = 'none';

    // Show notification
    const notif = document.getElementById('notification');
    notif.style.display = 'block';
    setTimeout(() => {
        notif.style.display = 'none';
    }, 3000);
}

window.onload = initializeData;
