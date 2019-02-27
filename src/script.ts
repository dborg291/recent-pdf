"use strict";
/// <reference path='../node_modules/@types/chrome/index.d.ts'/>

// files lists
let onlineList: HTMLUListElement = <HTMLUListElement>document.getElementById("link-list"); // online file list
let offlineFileList: HTMLUListElement = <HTMLUListElement>document.getElementById("file-list"); // offline (local) file list

// tab buttons
let onlineTabLink: HTMLButtonElement = <HTMLButtonElement>document.getElementById("online-tab-link");
let localTabLink: HTMLButtonElement = <HTMLButtonElement>document.getElementById("local-tab-link");
let settingsTabLink: HTMLButtonElement = <HTMLButtonElement>document.getElementById("settings-link");

loadSettings(); // load the user settings
searchHistory(); // search for pdf files

let onlinePdfCount: number = 0; // number of online pdf files
function searchHistory() {
    chrome.history.search(
        {
            text: ".pdf", // search for .pdf
            maxResults: 10000
        },
        function(data: chrome.history.HistoryItem[]) {
            data.forEach(function(page: chrome.history.HistoryItem) {
                if (page.url.endsWith(".pdf") || page.url.endsWith(".PDF")) {
                    let listItem: HTMLLIElement = <HTMLLIElement>document.createElement("li");
                    listItem.classList.add("list-item");

                    if (!page.url.startsWith("file:")) {
                        // if not local pdf
                        onlinePdfCount++;

                        let leftDiv = document.createElement("div");
                        let rightDiv = document.createElement("div");
                        leftDiv.classList.add("list-div", "left");
                        rightDiv.classList.add("list-div", "right");

                        // make title element
                        let title = document.createElement("p");
                        title.classList.add("link-title");
                        title.innerText = decodeURI(page.url).substring(page.url.lastIndexOf("/") + 1, page.url.length - 4);

                        // make url element
                        let linkUrl: HTMLParagraphElement = document.createElement("p");
                        linkUrl.classList.add("link-url");
                        linkUrl.innerHTML = decodeURI(page.url)
                            .substring(0, 50)
                            .replace(" ", "");

                        // make icon element
                        let icon: HTMLImageElement = document.createElement("img");
                        icon.classList.add("link-thumb");
                        icon.src = `chrome://favicon/${page.url}`;

                        // append elements to left div
                        leftDiv.appendChild(icon);
                        leftDiv.appendChild(title);
                        leftDiv.appendChild(linkUrl);

                        // on click listener
                        leftDiv.addEventListener("click", function() {
                            window.open(page.url);
                        });

                        // append to list item
                        listItem.appendChild(leftDiv);
                        listItem.appendChild(rightDiv);
                        // append list item to online list
                        onlineList.appendChild(listItem);
                    }
                }
            });
            onlineFooter(onlinePdfCount);
            searchDownloads();
            console.log(`${onlinePdfCount} online PDFs found.`);
        }
    );
}

let localFiles: any[] = [];
let localPdfCount: number = 0; // number of local pdf files
/**
 * searchDownloads() - searches downloads with chrome.downloads api for local pdf files
 */
function searchDownloads() {
    chrome.downloads.search(
        {
            limit: 1000,
            orderBy: ["-startTime"]
        },
        function(data: chrome.downloads.DownloadItem[]) {
            data.forEach(function(file: chrome.downloads.DownloadItem, i: number) {
                // for each result
                console.log("TCL: searchDownloads -> i", i);
                if (file.filename.endsWith(".pdf") || file.filename.endsWith(".PDF")) {
                    // check if file ends with .pdf or .PDF
                    if (localFiles.indexOf(file.filename) === -1 && localPdfCount < 30) {
                        // check for duplicated and max of 30 files
                        localFiles.push(file.filename);
                        localPdfCount++;

                        let leftDiv: HTMLDivElement = document.createElement("div");
                        let rightDiv: HTMLDivElement = document.createElement("div");
                        leftDiv.classList.add("list-div", "left");
                        rightDiv.classList.add("list-div", "right");

                        // create local file list item
                        let fileItem: HTMLLIElement = document.createElement("li");
                        fileItem.classList.add("list-item", "file-item");

                        // create icon element
                        let icon: HTMLImageElement = document.createElement("img");
                        icon.classList.add("link-thumb");
                        chrome.downloads.getFileIcon(file.id, { size: 16 }, iconUrl => {
                            icon.src = iconUrl;
                        });

                        // create title element
                        let title: HTMLParagraphElement = document.createElement("p");
                        title.classList.add("link-title");
                        title.classList.add("local-title");
                        title.innerText = file.filename.substring(file.filename.lastIndexOf("\\") + 1, file.filename.length - 4);

                        // create file url element
                        let linkUrl = document.createElement("p");
                        linkUrl.classList.add("link-url");
                        linkUrl.innerHTML = file.filename.substring(0, 50);

                        // append elements to div
                        leftDiv.appendChild(icon);
                        leftDiv.appendChild(title);
                        leftDiv.appendChild(linkUrl);

                        // on click listener
                        leftDiv.addEventListener("click", function() {
                            chrome.downloads.open(file.id);
                        });

                        // open in file explorer button
                        let more: HTMLImageElement = document.createElement("img");
                        more.id = "more_icon";
                        more.src = "../../assets/More.png";
                        more.addEventListener("click", function() {
                            chrome.downloads.show(file.id);
                        });

                        rightDiv.appendChild(more);
                        fileItem.appendChild(leftDiv);
                        fileItem.appendChild(rightDiv);
                        offlineFileList.appendChild(fileItem);
                    } else {
                        console.log(`[INFO] skipped duplicate file: ${file.filename}.`);
                    }
                }
            });

            console.log(`[INFO] ${localPdfCount} local PDFs found.`);
            loadSettings(); // load settings
        }
    );
}

if (onlineTabLink !== null) {
    // event handlers for tab buttons
    onlineTabLink.addEventListener("click", function(event) {
        onlineFooter(onlinePdfCount);
        changeTab(event, "online");
    });
    // open the online tab by default
    onlineTabLink.click();
}

if (localTabLink !== null) {
    // click listener for local pdf tab
    localTabLink.addEventListener("click", function(event) {
        localFooter(localPdfCount);
        changeTab(event, "local");
    });
}

if (settingsTabLink !== null) {
    // settings click listener
    settingsTabLink.addEventListener("click", function() {
        window.open("./options.html");
    });
}

// function that loads the settings from the options.js script
function loadSettings() {
    chrome.storage.sync.get(["savedTab", "filesPerPage"], function(result) {
        console.log(result);
        if (result.savedTab) {
            document.getElementById("online-footer").style.color = "red";
        }
    });
}

function changeTab(evt: any, tabName: string) {
    const activeElements = document.querySelectorAll(".active");
    activeElements.forEach(elem => {
        elem.classList.remove("active");
    });
    const tab = document.querySelector(`.tabcontent#${tabName}`);
    if (tab) tab.classList.add("active");
    evt.currentTarget.classList.add("active");
}

// load and create the online pdf footer
function onlineFooter(count: number) {
    let plural = count > 1 ? "s" : "";
    let countDisplay: HTMLParagraphElement = <HTMLParagraphElement>document.getElementById("count-display");
    countDisplay.innerHTML = `Showing ${count} online PDF${plural}.`;
}

// load and create the local file footer
function localFooter(count: number) {
    let plural: string = count > 1 ? "s" : "";
    let countDisplay: HTMLParagraphElement = <HTMLParagraphElement>document.getElementById("count-display");
    countDisplay.innerHTML = `Showing ${count} local PDF${plural}.`;
}
