// ============ DONNÉES DE DÉMONSTRATION ============
// En production, ces données viendront de votre API Starblast

const mockPlayersData = {
    kills: [
        { rank: 1, name: 'NeuroX', kills: 2847, survivalScore: 5420, teamScore: 3200, totalPoints: 11467 },
        { rank: 2, name: 'PhantomKnight', kills: 2654, survivalScore: 4980, teamScore: 3100, totalPoints: 10734 },
        { rank: 3, name: 'VoidSlayer', kills: 2521, survivalScore: 4650, teamScore: 2980, totalPoints: 10151 },
        { rank: 4, name: 'SilentHunter', kills: 2398, survivalScore: 4420, teamScore: 2850, totalPoints: 9668 },
        { rank: 5, name: 'CrimsonBlade', kills: 2245, survivalScore: 4100, teamScore: 2700, totalPoints: 9045 },
        { rank: 6, name: 'TitanForce', kills: 2156, survivalScore: 3890, teamScore: 2650, totalPoints: 8696 },
        { rank: 7, name: 'EchoStorm', kills: 2034, survivalScore: 3720, teamScore: 2500, totalPoints: 8254 },
        { rank: 8, name: 'InfernoX', kills: 1945, survivalScore: 3540, teamScore: 2420, totalPoints: 7905 },
        { rank: 9, name: 'NovaReborn', kills: 1876, survivalScore: 3320, teamScore: 2350, totalPoints: 7546 },
        { rank: 10, name: 'VenomCore', kills: 1754, survivalScore: 3100, teamScore: 2200, totalPoints: 7054 }
    ],
    survival: [
        { rank: 1, name: 'IceVortex', kills: 1890, survivalScore: 6200, teamScore: 2800, totalPoints: 10890 },
        { rank: 2, name: 'PhoenixRise', kills: 1654, survivalScore: 5890, teamScore: 2650, totalPoints: 10194 },
        { rank: 3, name: 'NeuroX', kills: 2847, survivalScore: 5420, teamScore: 3200, totalPoints: 11467 },
        { rank: 4, name: 'ShadowDancer', kills: 1520, survivalScore: 5200, teamScore: 2400, totalPoints: 9120 },
        { rank: 5, name: 'ThunderStrike', kills: 1445, survivalScore: 4980, teamScore: 2350, totalPoints: 8775 },
        { rank: 6, name: 'FrostByte', kills: 1380, survivalScore: 4720, teamScore: 2200, totalPoints: 8300 },
        { rank: 7, name: 'VoidWalker', kills: 1250, survivalScore: 4450, teamScore: 2100, totalPoints: 7800 },
        { rank: 8, name: 'NeonPulse', kills: 1190, survivalScore: 4200, teamScore: 2050, totalPoints: 7440 },
        { rank: 9, name: 'SolarFlare', kills: 1120, survivalScore: 4010, teamScore: 1950, totalPoints: 7080 },
        { rank: 10, name: 'CyberNova', kills: 1045, survivalScore: 3850, teamScore: 1850, totalPoints: 6745 }
    ],
    team: [
        { rank: 1, name: 'TeamLegends', kills: 1200, survivalScore: 2100, teamScore: 5200, totalPoints: 8500 },
        { rank: 2, name: 'AlphaSquad', kills: 1150, survivalScore: 2000, teamScore: 4850, totalPoints: 8000 },
        { rank: 3, name: 'EchoForce', kills: 1080, survivalScore: 1920, teamScore: 4620, totalPoints: 7620 },
        { rank: 4, name: 'VortexTeam', kills: 1020, survivalScore: 1850, teamScore: 4380, totalPoints: 7250 },
        { rank: 5, name: 'NovaDivision', kills: 980, survivalScore: 1750, teamScore: 4150, totalPoints: 6880 },
        { rank: 6, name: 'PhantomCrew', kills: 945, survivalScore: 1680, teamScore: 3920, totalPoints: 6545 },
        { rank: 7, name: 'VenomSquad', kills: 890, survivalScore: 1600, teamScore: 3680, totalPoints: 6170 },
        { rank: 8, name: 'InfernoTeam', kills: 850, survivalScore: 1520, teamScore: 3450, totalPoints: 5820 },
        { rank: 9, name: 'FrostAlliance', kills: 810, survivalScore: 1450, teamScore: 3200, totalPoints: 5460 },
        { rank: 10, name: 'TitanBrigade', kills: 760, survivalScore: 1350, teamScore: 2980, totalPoints: 5090 }
    ]
};

// ============ VARIABLES GLOBALES ============
let currentFilter = 'all';
let currentSort = 'kills';
let currentTheme = localStorage.getItem('orbite-theme') || 'nebula';
let settingsModal, aboutModal;

// ============ INITIALISATION ============
document.addEventListener('DOMContentLoaded', () => {
    initializeModals();
    initializeEventListeners();
    applyTheme(currentTheme);
    updateLeaderboards();
    updateStats();
    
    // Actualisation automatique toutes les 30s
    setInterval(updateLeaderboards, 30000);
});

// ============ MODALES ============
function initializeModals() {
    settingsModal = new bootstrap.Modal(document.getElementById('settingsModal'), {
        keyboard: false,
        backdrop: 'static'
    });

    aboutModal = new bootstrap.Modal(document.getElementById('aboutModal'), {
        keyboard: true,
        backdrop: true
    });

    document.getElementById('btnSettings').addEventListener('click', () => {
        settingsModal.show();
    });

    document.getElementById('btnInfo').addEventListener('click', () => {
        document.getElementById('lastUpdate').innerText = new Date().toLocaleTimeString('fr-FR');
        aboutModal.show();
    });
}

// ============ EVENT LISTENERS ============
function initializeEventListeners() {
    // Filtres
    document.getElementById('filterMode').addEventListener('change', (e) => {
        currentFilter = e.target.value;
        updateLeaderboards();
    });

    document.getElementById('sortBy').addEventListener('change', (e) => {
        currentSort = e.target.value;
        updateLeaderboards();
    });

    // Onglets
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.dataset.tab);
        });
    });

    // Thème
    document.getElementById('themeSelect').addEventListener('change', (e) => {
        applyTheme(e.target.value);
    });

    // Bouton retour
    document.getElementById('btnBackToList').addEventListener('click', () => {
        document.getElementById('playerDetails').style.display = 'none';
        document.querySelector('.leaderboards-container').style.display = 'block';
    });

    // Curseur personnalisé
    document.addEventListener('mousemove', (e) => {
        const cursor = document.getElementById('orbiteCursor');
        cursor.style.left = (e.clientX - 18) + 'px';
        cursor.style.top = (e.clientY - 18) + 'px';
    });
}

// ============ GESTION DES ONGLETS ============
function switchTab(tabName) {
    // Masquer tous les panneaux
    document.querySelectorAll('.leaderboard-panel').forEach(panel => {
        panel.classList.remove('active');
    });

    // Masquer les détails du joueur
    document.getElementById('playerDetails').style.display = 'none';
    document.querySelector('.leaderboards-container').style.display = 'block';

    // Afficher le panneau sélectionné
    document.getElementById(`tab-${tabName}`).classList.add('active');

    // Mettre à jour les boutons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        }
    });
}

// ============ MIS À JOUR DES CLASSEMENTS ============
function updateLeaderboards() {
    const currentTab = document.querySelector('.leaderboard-panel.active');
    const tabName = currentTab ? currentTab.id.split('-')[1] : 'kills';

    switch (tabName) {
        case 'kills':
            renderLeaderboard('listKills', mockPlayersData.kills);
            break;
        case 'survival':
            renderLeaderboard('listSurvival', mockPlayersData.survival);
            break;
        case 'team':
            renderLeaderboard('listTeam', mockPlayersData.team);
            break;
        case 'combined':
            renderCombinedLeaderboard();
            break;
    }
}

function renderLeaderboard(containerId, data) {
    const container = document.getElementById(containerId);
    
    let sortedData = [...data];
    
    // Appliquer le tri
    switch (currentSort) {
        case 'kills':
            sortedData.sort((a, b) => b.kills - a.kills);
            break;
        case 'survivalScore':
            sortedData.sort((a, b) => b.survivalScore - a.survivalScore);
            break;
        case 'teamScore':
            sortedData.sort((a, b) => b.teamScore - a.teamScore);
            break;
        case 'totalPoints':
            sortedData.sort((a, b) => b.totalPoints - a.totalPoints);
            break;
    }

    // Générer le HTML
    let html = '';
    sortedData.forEach((player, index) => {
        const rankClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';
        const displayRank = index + 1;
        const medalIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : displayRank;

        let scoreDisplay = '';
        switch (currentSort) {
            case 'kills':
                scoreDisplay = `${player.kills.toLocaleString('fr-FR')}`;
                break;
            case 'survivalScore':
                scoreDisplay = `${player.survivalScore.toLocaleString('fr-FR')}`;
                break;
            case 'teamScore':
                scoreDisplay = `${player.teamScore.toLocaleString('fr-FR')}`;
                break;
            case 'totalPoints':
                scoreDisplay = `${player.totalPoints.toLocaleString('fr-FR')}`;
                break;
        }

        html += `
            <div class="leaderboard-row" onclick="showPlayerDetails(this)">
                <div class="rank-position ${rankClass}">${medalIcon}</div>
                <div class="rank-info">
                    <div class="rank-name">${player.name}</div>
                    <div class="rank-subtitle">
                        🎯 ${player.kills.toLocaleString('fr-FR')} kills
                        • 💪 Survie: ${player.survivalScore.toLocaleString('fr-FR')}
                    </div>
                </div>
                <div class="rank-score">
                    <div class="rank-value">${scoreDisplay}</div>
                    <div class="rank-label">${getLabelForSort(currentSort)}</div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function renderCombinedLeaderboard() {
    const container = document.getElementById('listCombined');
    
    // Combiner tous les joueurs
    const allPlayers = {};
    
    [...mockPlayersData.kills, ...mockPlayersData.survival, ...mockPlayersData.team].forEach(player => {
        if (!allPlayers[player.name]) {
            allPlayers[player.name] = { name: player.name, kills: 0, survivalScore: 0, teamScore: 0, totalPoints: 0 };
        }
        allPlayers[player.name].kills = Math.max(allPlayers[player.name].kills, player.kills);
        allPlayers[player.name].survivalScore = Math.max(allPlayers[player.name].survivalScore, player.survivalScore);
        allPlayers[player.name].teamScore = Math.max(allPlayers[player.name].teamScore, player.teamScore);
        allPlayers[player.name].totalPoints = allPlayers[player.name].kills + allPlayers[player.name].survivalScore + allPlayers[player.name].teamScore;
    });

    const combinedData = Object.values(allPlayers).sort((a, b) => b.totalPoints - a.totalPoints);

    let html = '';
    combinedData.slice(0, 10).forEach((player, index) => {
        const rankClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';
        const medalIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : (index + 1);

        html += `
            <div class="leaderboard-row" onclick="showPlayerDetails(this)">
                <div class="rank-position ${rankClass}">${medalIcon}</div>
                <div class="rank-info">
                    <div class="rank-name">${player.name}</div>
                    <div class="rank-subtitle">
                        🎯 ${player.kills.toLocaleString('fr-FR')} kills • 💪 ${(player.survivalScore + player.teamScore).toLocaleString('fr-FR')} pts
                    </div>
                </div>
                <div class="rank-score">
                    <div class="rank-value">${player.totalPoints.toLocaleString('fr-FR')}</div>
                    <div class="rank-label">POINTS</div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function getLabelForSort(sort) {
    const labels = {
        'kills': 'KILLS',
        'survivalScore': 'SURVIE',
        'teamScore': 'ÉQUIPE',
        'totalPoints': 'TOTAL'
    };
    return labels[sort] || 'SCORE';
}

// ============ MIS À JOUR DES STATISTIQUES ============
function updateStats() {
    const totalPlayers = new Set([
        ...mockPlayersData.kills.map(p => p.name),
        ...mockPlayersData.survival.map(p => p.name),
        ...mockPlayersData.team.map(p => p.name)
    ]).size;

    const totalKills = mockPlayersData.kills.reduce((sum, p) => sum + p.kills, 0);
    
    document.getElementById('statActivePlayers').innerText = totalPlayers;
    document.getElementById('statActiveGames').innerText = Math.floor(Math.random() * 50) + 10;
    document.getElementById('statTotalKills').innerText = totalKills.toLocaleString('fr-FR');
}

// ============ DÉTAILS JOUEUR ============
function showPlayerDetails(element) {
    const playerName = element.querySelector('.rank-name').innerText;
    const player = findPlayerByName(playerName);

    if (!player) return;

    document.querySelector('.leaderboards-container').style.display = 'none';
    document.getElementById('playerDetails').style.display = 'block';

    document.getElementById('playerName').innerText = player.name;
    document.getElementById('playerKills').innerText = player.kills.toLocaleString('fr-FR');
    document.getElementById('playerSurvival').innerText = player.survivalScore.toLocaleString('fr-FR');
    document.getElementById('playerTeam').innerText = player.teamScore.toLocaleString('fr-FR');
    document.getElementById('playerTotal').innerText = player.totalPoints.toLocaleString('fr-FR');

    window.scrollTo(0, 0);
}

function findPlayerByName(name) {
    for (let data of Object.values(mockPlayersData)) {
        const player = data.find(p => p.name === name);
        if (player) return player;
    }
    return null;
}

// ============ THÈME ============
function applyTheme(theme) {
    currentTheme = theme;
    localStorage.setItem('orbite-theme', theme);
    document.body.setAttribute('data-theme', theme);
    document.getElementById('themeSelect').value = theme;
}

// ============ FORMAT NOMBRES ============
function formatNumber(num) {
    return num.toLocaleString('fr-FR');
}
