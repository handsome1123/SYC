// get book from database
async function getBookNo() {
    try {
        const response = await fetch('/dashboard');
        if (response.ok) {
            const data = await response.json();
            showBookNo(data);
        }
        else if (response.status == 500) {
            const data = await response.text();
            throw Error(data);
        }
        else {
            throw Error('Connection error');
        }
    } catch (err) {
        console.error(err.message);
        Notiflix.Report.failure('Error', err.message, 'Close');
    }
}

// shwo book 
function showBookNo(data) {
    const { available_books, borrowed_books, disabled_books, pending_books } = data;

    // Example: Displaying the counts
    const bookCountsHTML = `
    <div id="db" class="col-md-3  bg-warning p-4" >
    <div id="label" class="text-white">
        BORROWED ASSETS


        <div id="text" class="text-white" style="font-size: 100px;">
        ${borrowed_books}
        </div>
    </div>
</div>
<div id="db" class="col-md-3 bg-success p-4"  >
    <div id="label" class="text-white">
        AVAILABLE ASSETS


        <div id="text" class="text-white" style="font-size: 100px;">
        ${available_books}
        </div>
    </div>
</div>
<div id="db" class="col-md-3 bg-danger p-4"  >
    <div id="label" class="text-white">
        DISABLE ASSETS


        <div id="text" class="text-white" style="font-size: 100px;">
        ${disabled_books}
        </div>
    </div>
</div>
<div id="db" class="col-md-3 bg-secondary p-4" >
    <div id="label" class="text-white">
        PENDING ASSETS


        <div id="text" class="text-white" style="font-size: 100px;">
        ${pending_books}
        </div>
    </div>
</div>
    `;
    document.getElementById('bookCounts').innerHTML = bookCountsHTML;
}


// Call the function when the page loads
getBookNo();