const WHATSAPP_NUMBER = "917478004111";
const DATA_URL = "./data/trophy_prices.json";

let products = [];
let filtered = [];

// --------------------------------------------------
// ELEMENTS
// --------------------------------------------------

const $ = id => document.getElementById(id);

const grid = $("productGrid");
const loading = $("loadingState");
const error = $("errorState");
const empty = $("emptyState");

const heroSearch = $("searchInput");
const search2 = $("searchInput2");

const type = $("typeFilter");
const min = $("minPrice");
const max = $("maxPrice");

const sort = $("sortSelect");


// --------------------------------------------------
// INITIALIZE
// --------------------------------------------------

document.addEventListener("DOMContentLoaded", init);


async function init() {

    console.log("=================================");
    console.log("CUSTOKING TROPHY CATALOGUE");
    console.log("=================================");

    console.log("Loading JSON:", DATA_URL);

    // --------------------------------------------------
    // YEAR
    // --------------------------------------------------

    if ($("year")) {
        $("year").textContent =
            new Date().getFullYear();
    }


    // --------------------------------------------------
    // SEARCH SYNCHRONIZATION
    // --------------------------------------------------

    if (heroSearch && search2) {

        heroSearch.addEventListener("input", () => {

            search2.value =
                heroSearch.value;

            applyFilters();

        });


        search2.addEventListener("input", () => {

            heroSearch.value =
                search2.value;

            applyFilters();

        });

    }


    // --------------------------------------------------
    // FILTER EVENTS
    // --------------------------------------------------

    [type, min, max, sort].forEach(element => {

        if (!element) return;

        element.addEventListener(
            "input",
            applyFilters
        );

        element.addEventListener(
            "change",
            applyFilters
        );

    });


    // --------------------------------------------------
    // RESET BUTTONS
    // --------------------------------------------------

    if ($("resetButton")) {

        $("resetButton").onclick = reset;

    }


    if ($("emptyResetButton")) {

        $("emptyResetButton").onclick = reset;

    }


    // --------------------------------------------------
    // LOAD JSON
    // --------------------------------------------------

    try {

        console.log(
            "Fetching:",
            DATA_URL
        );


        const response =
            await fetch(DATA_URL);


        console.log(
            "HTTP Status:",
            response.status
        );


        console.log(
            "Response OK:",
            response.ok
        );


        if (!response.ok) {

            throw new Error(
                `Could not load JSON. HTTP status: ${response.status}`
            );

        }


        // --------------------------------------------------
        // READ JSON AS TEXT FIRST
        // --------------------------------------------------

        const text =
            await response.text();


        console.log(
            "JSON received."
        );


        console.log(
            "JSON length:",
            text.length
        );


        if (!text.trim()) {

            throw new Error(
                "trophy_prices.json is empty."
            );

        }


        // --------------------------------------------------
        // PARSE JSON
        // --------------------------------------------------

        let data;


        try {

            data =
                JSON.parse(text);

        } catch (jsonError) {

            console.error(
                "JSON PARSE ERROR:",
                jsonError
            );


            throw new Error(
                "trophy_prices.json contains invalid JSON."
            );

        }


        // --------------------------------------------------
        // CHECK ARRAY
        // --------------------------------------------------

        if (!Array.isArray(data)) {

            throw new Error(
                "trophy_prices.json must contain an array."
            );

        }


        console.log(
            "Total records in JSON:",
            data.length
        );


        // --------------------------------------------------
        // CLEAN PRODUCT DATA
        // --------------------------------------------------

        products =
            data
                .map((product, index) => {

                    if (
                        !product ||
                        typeof product !== "object"
                    ) {

                        console.warn(
                            `Invalid product at index ${index}`
                        );

                        return null;

                    }


                    const model =
                        String(
                            product.model ?? ""
                        ).trim();


                    const productType =
                        String(
                            product.type ?? "Trophy"
                        ).trim();


                    // IMPORTANT:
                    // Use startingPrice directly
                    // from JSON.
                    const startingPrice =
                        Number(
                            product.startingPrice
                        );


                    const sizes =
                        product.sizes &&
                        typeof product.sizes === "object"
                            ? product.sizes
                            : {};


                    // --------------------------------------------------
                    // INVALID MODEL
                    // --------------------------------------------------

                    if (!model) {

                        console.warn(
                            `Skipping record ${index}: missing model`
                        );

                        return null;

                    }


                    // --------------------------------------------------
                    // INVALID STARTING PRICE
                    // --------------------------------------------------

                    if (
                        !Number.isFinite(
                            startingPrice
                        )
                    ) {

                        console.warn(
                            `Skipping ${model}: invalid startingPrice`
                        );

                        return null;

                    }


                    // --------------------------------------------------
                    // NO SIZES
                    // --------------------------------------------------

                    if (
                        Object.keys(sizes).length === 0
                    ) {

                        console.warn(
                            `Skipping ${model}: no sizes`
                        );

                        return null;

                    }


                    return {

                        model,

                        type: productType,

                        startingPrice,

                        sizes

                    };

                })
                .filter(Boolean);


        console.log(
            "Valid JSON products:",
            products.length
        );


        // --------------------------------------------------
        // CHECK IMAGES
        // --------------------------------------------------

        console.log(
            "================================="
        );

        console.log(
            "CHECKING PRODUCT IMAGES"
        );

        console.log(
            "================================="
        );


        const productsWithImages =
            await Promise.all(
                products.map(
                    product =>
                        checkImage(product)
                )
            );


        // Remove products whose images
        // do not exist.
        products =
            productsWithImages
                .filter(Boolean);


        console.log(
            "================================="
        );

        console.log(
            "IMAGE CHECK COMPLETE"
        );

        console.log(
            "================================="
        );


        console.log(
            "Products with matching images:",
            products.length
        );


        // --------------------------------------------------
        // NO PRODUCTS LEFT
        // --------------------------------------------------

        if (products.length === 0) {

            throw new Error(
                "No products have matching images. Check the images folder and filenames."
            );

        }


        // --------------------------------------------------
        // MODEL COUNT
        // --------------------------------------------------

        if ($("totalModels")) {

            $("totalModels").textContent =
                products.length
                    .toLocaleString("en-IN");

        }


        // --------------------------------------------------
        // HIDE LOADING
        // --------------------------------------------------

        loading.classList.add("hidden");


        // --------------------------------------------------
        // APPLY FILTERS
        // --------------------------------------------------

        applyFilters();


    } catch (err) {

        console.error(
            "================================="
        );

        console.error(
            "CATALOGUE ERROR"
        );

        console.error(
            "================================="
        );

        console.error(err);


        if (loading) {

            loading.classList.add("hidden");

        }


        if (error) {

            error.classList.remove("hidden");


            const errorText =
                error.querySelector("p");


            if (errorText) {

                errorText.innerHTML = `
                    <strong>Catalogue loading error:</strong>
                    <br><br>
                    ${esc(err.message)}
                    <br><br>
                    Open the browser console with F12
                    for more details.
                `;

            }

        }

    }

}


// --------------------------------------------------
// IMAGE CHECK
// --------------------------------------------------

function checkImage(product) {

    return new Promise(resolve => {

        const img =
            new Image();


        /*
         * Image filename is based on model.
         *
         * Example:
         *
         * WM001 -> images/WM001.jpg
         * 9116  -> images/9116.jpg
         * A-3   -> images/A-3.jpg
         */

        const imagePath =
            `images/${encodeURIComponent(product.model)}.jpg`;


        img.onload = () => {

            console.log(
                `✓ Image found: ${product.model}.jpg`
            );


            // Keep product
            resolve(product);

        };


        img.onerror = () => {

            console.warn(
                `✗ Image missing: ${product.model}.jpg — product ignored`
            );


            // Remove product
            resolve(null);

        };


        img.src = imagePath;

    });

}


// --------------------------------------------------
// FILTER PRODUCTS
// --------------------------------------------------

function applyFilters() {

    const query =
        search2
            ? search2.value
                .trim()
                .toLowerCase()
            : "";


    const selectedType =
        type
            ? type.value
            : "all";


    const minimum =
        min && min.value !== ""
            ? Number(min.value)
            : null;


    const maximum =
        max && max.value !== ""
            ? Number(max.value)
            : null;


    // --------------------------------------------------
    // FILTER
    // --------------------------------------------------

    filtered =
        products.filter(product => {


            // SEARCH
            const matchesSearch =
                !query ||
                product.model
                    .toLowerCase()
                    .includes(query);


            // TYPE
            const matchesType =
                selectedType === "all" ||
                product.type === selectedType;


            // MINIMUM STARTING PRICE
            const matchesMin =
                minimum === null ||
                product.startingPrice >= minimum;


            // MAXIMUM STARTING PRICE
            const matchesMax =
                maximum === null ||
                product.startingPrice <= maximum;


            return (
                matchesSearch &&
                matchesType &&
                matchesMin &&
                matchesMax
            );

        });


    // --------------------------------------------------
    // SORT
    // --------------------------------------------------
    /*
     * IMPORTANT:
     *
     * Sorting is ONLY based on startingPrice
     * from the JSON.
     *
     * It does NOT use:
     *
     * - selected size
     * - selected size price
     * - model number
     * - product name
     */

    if (
        sort &&
        sort.value === "price-high"
    ) {

        filtered.sort(
            (a, b) =>
                b.startingPrice -
                a.startingPrice
        );

    } else {

        // Default:
        // Starting Price Low to High

        filtered.sort(
            (a, b) =>
                a.startingPrice -
                b.startingPrice
        );

    }


    console.log(
        "Filtered products:",
        filtered.length
    );


    // --------------------------------------------------
    // RENDER
    // --------------------------------------------------

    render();

}


// --------------------------------------------------
// RENDER PRODUCTS
// --------------------------------------------------

function render() {

    if ($("resultCount")) {

        $("resultCount").textContent =
            filtered.length
                .toLocaleString("en-IN");

    }


    // --------------------------------------------------
    // NO RESULTS
    // --------------------------------------------------

    if (!filtered.length) {

        grid.innerHTML = "";


        if (empty) {

            empty.classList.remove("hidden");

        }


        return;

    }


    // --------------------------------------------------
    // SHOW PRODUCTS
    // --------------------------------------------------

    if (empty) {

        empty.classList.add("hidden");

    }


    grid.innerHTML =
        filtered
            .map(product => card(product))
            .join("");


    bindCards();

}


// --------------------------------------------------
// CREATE PRODUCT CARD
// --------------------------------------------------

function card(product) {

    // --------------------------------------------------
    // GET VALID SIZES
    // --------------------------------------------------

    const sizes =
        Object.entries(product.sizes)
            .filter(([, price]) => {

                return (
                    Number.isFinite(
                        Number(price)
                    ) &&
                    Number(price) > 0
                );

            });


    // If no valid sizes,
    // don't display product.
    if (!sizes.length) {

        return "";

    }


    // --------------------------------------------------
    // FIRST SIZE
    // --------------------------------------------------

    const first =
        sizes[0];


    // --------------------------------------------------
    // DROPDOWN OPTIONS
    // --------------------------------------------------

    const options =
        sizes
            .map(([size, price]) => {

                return `
                    <option
                        value="${esc(size)}"
                        data-price="${Number(price)}"
                    >
                        Size ${esc(size)} — ₹${money(price)}
                    </option>
                `;

            })
            .join("");


    // --------------------------------------------------
    // CARD
    // --------------------------------------------------

    return `

        <article class="card">

            <!-- IMAGE -->
            <div class="pic">

                <span class="badge">
                    ${esc(product.type)}
                </span>

                <span class="model">
                    ${esc(product.model)}
                </span>

                <img
                    src="images/${encodeURIComponent(product.model)}.jpg"
                    alt="Custoking Trophy ${esc(product.model)}"
                    loading="lazy"
                >

            </div>


            <!-- CONTENT -->
            <div class="content">


                <!-- LABEL -->
                <div class="label">
                    TROPHY MODEL
                </div>


                <!-- MODEL -->
                <h3 class="model-name">
                    ${esc(product.model)}
                </h3>


                <!-- PRICE -->
                <div class="price-row">

                    <div class="price-label">
                        Selected Price
                    </div>


                    <div class="price">

                        <span class="symbol">
                            ₹
                        </span>

                        <span class="price-value">
                            ${money(first[1])}
                        </span>

                    </div>

                </div>


                <!-- SIZE -->
                <div class="size-section">


                    <div class="size-label">

                        <span>
                            Select Size & Price
                        </span>


                        <span>
                            ${sizes.length}
                            ${
                                sizes.length === 1
                                    ? "size"
                                    : "sizes"
                            }
                        </span>

                    </div>


                    <select
                        class="size-select"
                        aria-label="Select size for ${esc(product.model)}"
                    >

                        ${options}

                    </select>


                </div>


                <!-- WHATSAPP -->
                <button
                    class="wa"
                    type="button"
                    data-model="${esc(product.model)}"
                    data-type="${esc(product.type)}"
                >

                    ☏ &nbsp;
                    Enquire on WhatsApp

                </button>


            </div>

        </article>

    `;

}


// --------------------------------------------------
// BIND CARD EVENTS
// --------------------------------------------------

function bindCards() {


    // --------------------------------------------------
    // SIZE DROPDOWN
    // --------------------------------------------------

    document
        .querySelectorAll(".size-select")
        .forEach(select => {


            select.addEventListener(
                "change",
                () => {


                    const option =
                        select.options[
                            select.selectedIndex
                        ];


                    const priceElement =
                        select
                            .closest(".card")
                            .querySelector(
                                ".price-value"
                            );


                    if (priceElement) {

                        priceElement.textContent =
                            money(
                                option.dataset.price
                            );

                    }

                }

            );

        });


    // --------------------------------------------------
    // WHATSAPP BUTTON
    // --------------------------------------------------

    document
        .querySelectorAll(".wa")
        .forEach(button => {


            button.addEventListener(
                "click",
                () => {


                    const card =
                        button.closest(".card");


                    const select =
                        card.querySelector(
                            ".size-select"
                        );


                    const option =
                        select.options[
                            select.selectedIndex
                        ];


                    const model =
                        button.dataset.model;


                    const productType =
                        button.dataset.type;


                    const selectedSize =
                        option.value;


                    const selectedPrice =
                        option.dataset.price;


                    // --------------------------------------------------
                    // WHATSAPP MESSAGE
                    // --------------------------------------------------

                    const message =
`Hello Custoking,

I am interested in this trophy:

Model: ${model}
Type: ${productType}
Size: ${selectedSize}
Price: ₹${money(selectedPrice)}

Please share more details and availability.`;


                    const url =
                        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;


                    window.open(
                        url,
                        "_blank",
                        "noopener,noreferrer"
                    );

                }

            );

        });

}


// --------------------------------------------------
// RESET FILTERS
// --------------------------------------------------

function reset() {


    if (heroSearch) {

        heroSearch.value = "";

    }


    if (search2) {

        search2.value = "";

    }


    if (type) {

        type.value = "all";

    }


    if (min) {

        min.value = "";

    }


    if (max) {

        max.value = "";

    }


    if (sort) {

        sort.value = "price-low";

    }


    applyFilters();

}


// --------------------------------------------------
// FORMAT PRICE
// --------------------------------------------------

function money(value) {

    const number =
        Number(value);


    if (!Number.isFinite(number)) {

        return "0";

    }


    return number.toLocaleString(
        "en-IN",
        {
            maximumFractionDigits: 0
        }
    );

}


// --------------------------------------------------
// HTML ESCAPE
// --------------------------------------------------

function esc(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}