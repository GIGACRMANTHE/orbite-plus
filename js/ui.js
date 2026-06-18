/* Settings Modal Binding */

let settingsModal = new bootstrap.Modal(document.getElementById('settingsModal'), {
    keyboard: false
});

let aboutModal = new bootstrap.Modal(document.getElementById('aboutModal'), {
    keyboard: false
});

let shareGameModal = new bootstrap.Modal(document.getElementById("shareGameModal"), {
    keyboard: true,
    backdrop: true
});

document.getElementById("navbarSettingsButton").addEventListener("click", () => {
    settingsModal.show();
});

document.getElementById("navbarAboutButton").addEventListener("click", () => {
    document.getElementById("timeSinceLastUpdate").innerText = `${Math.floor((Date.now() - (window.siteConfig.revisionTime * 1000)) / 86400000)} days`;
    aboutModal.show();
});

document.getElementById("shareCustomGameCard").addEventListener("click", () => {
    shareGameModal.show();
    document.getElementById("customGameLinkInput").value = "";
    document.getElementById("customGameLinkInput").focus();
});

/* ORBITE PLUS Custom Control Binding */
let orbiteDispatchChange = function(element) {
    element.dispatchEvent(new Event("change", { bubbles: true }));
}

let orbiteSetModes = function(modes) {
    for (let mode of ["team", "survival", "deathmatch", "modding", "custom", "invasion"]) {
        let input = document.getElementById(`${mode}Mode`);
        let checked = modes.includes(mode);
        if (input.checked !== checked) {
            input.checked = checked;
            orbiteDispatchChange(input);
        }
    }
}

let orbiteRegionSelect = document.getElementById("orbiteRegionSelect");
if (orbiteRegionSelect) {
    orbiteRegionSelect.addEventListener("change", () => {
        let input = document.getElementById(orbiteRegionSelect.value);
        if (input) {
            input.checked = true;
            orbiteDispatchChange(input);
        }
    });
}

let orbiteModePreset = document.getElementById("orbiteModePreset");
if (orbiteModePreset) {
    orbiteModePreset.addEventListener("change", () => {
        let presets = {
            competitive: ["team", "survival"],
            team: ["team"],
            survival: ["survival"],
            all: ["team", "survival", "deathmatch", "modding", "custom", "invasion"]
        };
        orbiteSetModes(presets[orbiteModePreset.value] || presets.competitive);
    });
}

/* Responsive Scroll Height Setting */
let _scrollify = function() {
    let navbarHeight = document.getElementById("navbar").offsetHeight;
    let remainingSpace = window.innerHeight - navbarHeight;
    document.getElementById("systemsListContainer").style.maxHeight = `${remainingSpace}px`;
    document.getElementById("systemReport").style.maxHeight = `${remainingSpace}px`;
    document.getElementById("viewOptions").style.maxHeight = `${remainingSpace}px`;
}

_scrollify();
window.addEventListener("resize", _scrollify);

/* Hide System Report */
document.getElementById("systemReport").style.display = "none";

/* New Server Alert */
document.getElementById("newServerAlert").addEventListener("change", () => {
    if (Notification.permission !== "granted") {
        Notification.requestPermission().then();
    }
});

// fix to chrome scroll bug where on some themes scrollbar still shows, likely due to themes changing size of webpage by a minimal amount
setTimeout(_scrollify, 20);
