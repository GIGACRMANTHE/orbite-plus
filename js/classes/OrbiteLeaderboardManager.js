class OrbiteLeaderboardManager {
    constructor(options = {}) {
        this.storageKey = options.storageKey || "orbitePlusLeaderboardV2";
        this.maxFetchesPerTick = options.maxFetchesPerTick || 14;
        this.inFlight = new Set();
        this.state = this.normalizeState(this.load());
        this.theme = window.localStorage.getItem("orbitePlusTheme") || "nebula";
        this.cursor = window.localStorage.getItem("orbitePlusCursor") || "orbit";
    }

    load() {
        try {
            return JSON.parse(window.localStorage.getItem(this.storageKey)) || {};
        } catch (error) {
            return {};
        }
    }

    normalizeState(state) {
        return {
            modes: state.modes || { team: {}, survival: {} },
            shipRecords: state.shipRecords || {},
            gameRecords: state.gameRecords || {},
            sessions: state.sessions || {}
        };
    }

    save() {
        window.localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    }

    reset() {
        if (!confirm("Reset tous les records ORBITE PLUS ?")) return;
        this.state = this.normalizeState({});
        this.save();
        this.render();
    }

    initialize() {
        this.applyTheme(this.theme);
        this.applyCursor(this.cursor);
        this.bindControls();
        this.render();
        this.startCursor();
    }

    bindControls() {
        const themeSelect = document.getElementById("orbiteThemeMode");
        const cursorSelect = document.getElementById("orbiteCursorMode");
        const resetButton = document.getElementById("orbiteLeaderboardReset");

        if (themeSelect) {
            themeSelect.value = this.theme;
            themeSelect.addEventListener("change", () => this.applyTheme(themeSelect.value));
        }

        if (cursorSelect) {
            cursorSelect.value = this.cursor;
            cursorSelect.addEventListener("change", () => this.applyCursor(cursorSelect.value));
        }

        if (resetButton) resetButton.addEventListener("click", () => this.reset());
    }

    applyTheme(theme) {
        this.theme = theme;
        document.body.dataset.orbiteTheme = theme;
        window.localStorage.setItem("orbitePlusTheme", theme);
    }

    applyCursor(cursor) {
        this.cursor = cursor;
        document.body.dataset.orbiteCursor = cursor;
        window.localStorage.setItem("orbitePlusCursor", cursor);
    }

    startCursor() {
        const cursor = document.getElementById("orbiteCursor");
        if (!cursor || window.matchMedia("(pointer: coarse)").matches) return;

        document.addEventListener("pointermove", (event) => {
            cursor.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;
        }, { passive: true });
    }

    collectFromProvider(provider) {
        if (!provider || !Array.isArray(provider.simStatus)) return;

        let queued = 0;
        for (const server of provider.simStatus) {
            if (!server.systems) continue;
            for (const system of server.systems) {
                if (queued >= this.maxFetchesPerTick) return;
                const mode = this.detectMode(system);
                if (!["team", "survival"].includes(mode)) continue;

                const hydratedSystem = Object.assign({}, system, {
                    address: server.address,
                    region: server.location,
                    orbiteMode: mode
                });

                if (this.queueSystemFetch(hydratedSystem)) queued++;
            }
        }
    }

    detectMode(system, info = null) {
        const mode = info && info.mode ? info.mode : {};
        if (system && system.survival) return "survival";
        if (system && system.mode === "survival") return "survival";
        if (mode.id === "survival" || mode.root_mode === "survival") return "survival";
        if (mode.id === "team" || mode.root_mode === "team") return "team";
        if (system && system.mode === "team") return "team";
        if (system && system.mode === "modding" && !system.survival) return "team";
        return "unknown";
    }

    queueSystemFetch(system) {
        const key = `${system.id}@${system.address}`;
        if (this.inFlight.has(key)) return false;

        this.inFlight.add(key);
        fetch(`${window.siteConfig["static-api-provider"]}status/${key}`)
            .then(response => response.json())
            .then(info => this.captureSystemInfo(system, info))
            .catch(() => {})
            .finally(() => this.inFlight.delete(key));

        return true;
    }

    captureSystemInfo(system, info) {
        if (!info || !info.players) return;

        const mode = this.detectMode(system, info);
        if (!["team", "survival"].includes(mode)) return;

        const sessionKey = `${mode}:${system.id}@${system.address}`;
        const session = this.state.sessions[sessionKey] || {
            mode,
            players: {},
            gameName: system.name || `#${system.id}`,
            region: system.region || "",
            lastSeen: 0
        };
        let changed = false;
        let gameTotal = 0;

        for (const rawPlayer of Object.values(info.players)) {
            const name = this.cleanName(rawPlayer.player_name || rawPlayer.name || "Inconnu");
            if (!name || name === "???") continue;

            const value = this.extractKillValue(rawPlayer);
            if (value <= 0) continue;

            const previous = session.players[name] || 0;
            const delta = Math.max(0, value - previous);
            session.players[name] = Math.max(previous, value);
            gameTotal += session.players[name];

            if (delta > 0) {
                this.addPlayerKills(mode, name, delta, previous === 0);
                changed = true;
            }

            if (mode === "survival") {
                this.updateShipRecord(rawPlayer, name, value, system);
            }
        }

        session.lastSeen = Date.now();
        session.gameName = system.name || session.gameName;
        session.region = system.region || session.region;
        this.state.sessions[sessionKey] = session;

        this.updateGameRecord(mode, system, gameTotal);
        this.pruneSessions();

        if (changed || gameTotal > 0) {
            this.save();
            this.render();
        }

        this.renderSystemTop(info, mode);
    }

    addPlayerKills(mode, name, delta, newGame) {
        const bucket = this.state.modes[mode] || {};
        const player = bucket[name] || {
            name,
            kills: 0,
            games: 0,
            firstSeen: Date.now(),
            lastSeen: Date.now()
        };

        player.kills += delta;
        player.games += newGame ? 1 : 0;
        player.lastSeen = Date.now();
        bucket[name] = player;
        this.state.modes[mode] = bucket;
    }

    updateShipRecord(rawPlayer, name, kills, system) {
        const ship = this.extractShipName(rawPlayer);
        const current = this.state.shipRecords[ship];
        if (current && current.kills >= kills) return;

        this.state.shipRecords[ship] = {
            ship,
            name,
            kills,
            game: system.name || `#${system.id}`,
            region: system.region || "",
            updatedAt: Date.now()
        };
    }

    updateGameRecord(mode, system, totalKills) {
        if (totalKills <= 0) return;

        const key = `${mode}:${system.id}@${system.address}`;
        const current = this.state.gameRecords[key] || {};
        this.state.gameRecords[key] = {
            mode,
            key,
            name: system.name || `#${system.id}`,
            region: system.region || "",
            kills: Math.max(current.kills || 0, totalKills),
            players: system.players || current.players || 0,
            updatedAt: Date.now()
        };
    }

    extractKillValue(player) {
        const candidates = [
            player.kills,
            player.kill_count,
            player.killCount,
            player.score,
            player.points
        ];

        for (const candidate of candidates) {
            const value = Number(candidate);
            if (Number.isFinite(value)) return Math.max(0, Math.floor(value));
        }

        return 0;
    }

    extractShipName(player) {
        const ship = player.ship || player.ship_name || player.shipName || player.type || player.ship_id || player.shipId || player.model;
        if (ship == null || ship === "") return "Vaisseau inconnu";
        return `Vaisseau ${String(ship).replace(/[<>]/g, "").trim()}`;
    }

    cleanName(name) {
        return String(name).replaceAll("\u202E", "").replace(/[<>]/g, "").trim().slice(0, 32);
    }

    pruneSessions() {
        const maxAge = 1000 * 60 * 60 * 24 * 30;
        const now = Date.now();
        for (const [key, session] of Object.entries(this.state.sessions)) {
            if (now - (session.lastSeen || 0) > maxAge) delete this.state.sessions[key];
        }
    }

    getModeLeaders(mode, limit = 12) {
        return Object.values(this.state.modes[mode] || {})
            .sort((a, b) => b.kills - a.kills || b.games - a.games || b.lastSeen - a.lastSeen)
            .slice(0, limit);
    }

    getShipRecords(limit = 20) {
        return Object.values(this.state.shipRecords)
            .sort((a, b) => b.kills - a.kills || b.updatedAt - a.updatedAt)
            .slice(0, limit);
    }

    getGameRecords(limit = 12) {
        return Object.values(this.state.gameRecords)
            .sort((a, b) => b.kills - a.kills || b.updatedAt - a.updatedAt)
            .slice(0, limit);
    }

    render() {
        this.renderMode("team", "orbiteTeamLeaderboard", "Aucune partie Team Mode detectee pour le moment.");
        this.renderMode("survival", "orbiteSurvivalLeaderboard", "Aucune partie Survival detectee pour le moment.");
        this.renderShipRecords();
        this.renderGameRecords();

        const legacyTarget = document.getElementById("orbiteLeaderboard");
        if (legacyTarget) legacyTarget.innerHTML = document.getElementById("orbiteTeamLeaderboard")?.innerHTML || "";
    }

    renderMode(mode, elementId, emptyText) {
        const target = document.getElementById(elementId);
        if (!target) return;

        const leaders = this.getModeLeaders(mode);
        if (!leaders.length) {
            target.innerHTML = `<div class="orbite-empty">${emptyText}</div>`;
            return;
        }

        target.innerHTML = leaders.map((player, index) => `
            <div class="orbite-rank-row">
                <span class="orbite-rank-position">#${index + 1}</span>
                <span class="orbite-rank-name">${player.name}<small>${player.games} parties</small></span>
                <span class="orbite-rank-score">${player.kills.toLocaleString("fr-FR")}</span>
            </div>
        `).join("");
    }

    renderShipRecords() {
        const target = document.getElementById("orbiteSurvivalShipRecords");
        if (!target) return;

        const records = this.getShipRecords();
        if (!records.length) {
            target.innerHTML = `<div class="orbite-empty">Les records par vaisseau se remplissent uniquement en mode Survival.</div>`;
            return;
        }

        target.innerHTML = records.map((record, index) => `
            <div class="orbite-rank-row orbite-ship-row">
                <span class="orbite-rank-position">#${index + 1}</span>
                <span class="orbite-rank-name">${record.ship}<small>${record.name} | ${record.game}</small></span>
                <span class="orbite-rank-score">${record.kills.toLocaleString("fr-FR")}</span>
            </div>
        `).join("");
    }

    renderGameRecords() {
        const target = document.getElementById("orbiteGamesLeaderboard");
        if (!target) return;

        const games = this.getGameRecords();
        if (!games.length) {
            target.innerHTML = `<div class="orbite-empty">Les parties Team Mode et Survival apparaitront ici quand elles seront suivies.</div>`;
            return;
        }

        target.innerHTML = games.map((game, index) => `
            <div class="orbite-rank-row">
                <span class="orbite-rank-position">#${index + 1}</span>
                <span class="orbite-rank-name">${game.name}<small>${game.mode.toUpperCase()} | ${game.region} | ${game.players} joueurs</small></span>
                <span class="orbite-rank-score">${game.kills.toLocaleString("fr-FR")}</span>
            </div>
        `).join("");
    }

    renderSystemTop(info, mode) {
        const target = document.getElementById("SR_OrbiteTop");
        if (!target || !info || !info.players) return;

        const leaders = Object.values(info.players)
            .map(player => ({
                name: this.cleanName(player.player_name || player.name || "Inconnu"),
                kills: this.extractKillValue(player)
            }))
            .filter(player => player.name && player.kills > 0)
            .sort((a, b) => b.kills - a.kills)
            .slice(0, 3);

        target.innerText = leaders.length
            ? `${mode}: ${leaders.map(player => `${player.name} ${player.kills}`).join(" | ")}`
            : "Aucune donnee";
    }
}
