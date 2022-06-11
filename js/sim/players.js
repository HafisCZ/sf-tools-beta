FIGHT_DUMP_ENABLED = false;
FIGHT_DUMP_OUTPUT = [];

// WebWorker hooks
self.addEventListener('message', function (message) {
    var ts = Date.now();

    // Sent vars
    var player = message.data.player;
    var players = message.data.players;
    var mode = message.data.mode;
    var iterations = message.data.iterations || 100000;
    if (message.data.dev || false) {
        FIGHT_DUMP_ENABLED = true;
    }

    var tracking = message.data.tracking || 0;

    // Sim type decision
    if (mode == 'players_all') {
        new FightSimulator().simulateMultiple(player, players, iterations);
        self.postMessage({
            command: 'finished',
            results: player,
            logs: FIGHT_DUMP_OUTPUT,
            time: Date.now() - ts
        });
    } else if (mode == 'players_one') {
        new FightSimulator().simulateSingle(player, players, iterations);
        self.postMessage({
            command: 'finished',
            results: players,
            logs: FIGHT_DUMP_OUTPUT,
            time: Date.now() - ts
        });
    } else if (mode == 'players_tournament') {
        new FightSimulator().simulateTournament(player, players, iterations);
        self.postMessage({
            command: 'finished',
            results: player,
            logs: FIGHT_DUMP_OUTPUT,
            time: Date.now() - ts
        });
    } else if (mode == 'guilds') {
        var result = new GuildSimulator().simulate(player, players, iterations);

        self.postMessage({
            command: 'finished',
            results: result,
            time: Date.now() - ts
        });
    }

    self.close();
});

class GuildSimulator extends SimulatorBase {
    simulate (guildA, guildB, iterations = 10000) {
        var score = 0;

        this.cache(guildA, guildB);

        for (var i = 0; i < iterations; i++) {
            score += this.battle();
        }

        return 100 * score / iterations;
    }

    cache (ga, gb) {
        this.ga = ga.map(a => {
            var p = FighterModel.create(0, a.player);
            p.Inactive = a.Inactive;

            return p;
        });

        this.gb = gb.map(b => {
            var p = FighterModel.create(1, b.player);
            p.Inactive = b.Inactive;

            return p;
        });

        this.ga.sort((a, b) => a.Player.Level - b.Player.Level);
        this.gb.sort((a, b) => a.Player.Level - b.Player.Level);

        for (var player of this.ga) {
            player.MaximumHealth = player.getHealth();
            if (player.Inactive) {
                player.MaximumHealth /= 2;
            }
        }

        for (var player of this.gb) {
            player.MaximumHealth = player.getHealth();
            if (player.Inactive) {
                player.MaximumHealth /= 2;
            }
        }
    }

    // Guild battle
    battle () {
        this.la = [ ... this.ga ];
        this.lb = [ ... this.gb ];

        // Reset health
        for (var player of this.la) {
            player.Health = player.MaximumHealth;
        }

        for (var player of this.lb) {
            player.Health = player.MaximumHealth;
        }

        // Go through all players
        while (this.la.length > 0 && this.lb.length > 0) {
            this.a = this.la[0];
            this.b = this.lb[0];

            this.a.initialize(this.b);
            this.b.initialize(this.a);

            this.as = this.a.onFightStart(this.b);
            this.bs = this.b.onFightStart(this.a);

            if (this.fight() == 0) {
                this.la.shift();
            } else {
                this.lb.shift();
            }
        }

        // Return fight result
        return (this.la.length > 0 ? this.la[0].Index : this.lb[0].Index) == 0;
    }
}

class FightSimulator extends SimulatorBase {
    // Fight group
    simulate (players, iterations = 100000, target = null, assource = false) {
        var scores = [];
        for (var i = 0; i < players.length; i++) {
            var score = 0;
            var min = iterations;
            var max = 0;

            if (target) {
                if (assource) {
                    this.cache(target, players[i].player);
                    for (var k = 0; k < iterations; k++) {
                        score += this.fight();
                    }

                    players[i].score = {
                        avg: 100 * score / iterations,
                        min: 100 * score / iterations,
                        max: 100 * score / iterations
                    };
                } else {
                    this.cache(players[i].player, target);
                    for (var k = 0; k < iterations; k++) {
                        score += this.fight();
                    }

                    players[i].score = {
                        avg: 100 * score / iterations,
                        min: 100 * score / iterations,
                        max: 100 * score / iterations
                    };
                }
            } else {
                for (var j = 0; j < players.length; j++) {
                    if (i != j) {
                        var s = 0;

                        this.cache(players[i].player, players[j].player);
                        for (var k = 0; k < iterations; k++) {
                            s += this.fight();
                        }

                        score += s;

                        if (s > max) {
                            max = s;
                        }

                        if (s < min) {
                            min = s;
                        }
                    }
                }

                players[i].score = {
                    avg: 100 * score / (players.length - 1) / iterations,
                    min: 100 * min / iterations,
                    max: 100 * max / iterations
                };
            }
        }

        if (!target && players.length == 2) {
            players[1].score.avg = 100 - players[0].score.avg,
            players[1].score.min = players[1].score.avg;
            players[1].score.max = players[1].score.avg;
        }
    }

    // Fight 1vAl only
    simulateMultiple (player, players, iterations) {
        var scores = [];
        for (var i = 0; i < player.length; i++) {
            var score = 0;
            var min = iterations;
            var max = 0;

            for (var j = 0; j < players.length; j++) {
                if (player[i].index != players[j].index) {
                    var s = 0;
                    this.cache(player[i].player, players[j].player);
                    for (var k = 0; k < iterations; k++) {
                        s += this.fight();
                    }

                    score += s;

                    if (s > max) {
                        max = s;
                    }

                    if (s < min) {
                        min = s;
                    }
                }
            }

            player[i].score = {
                avg: 100 * score / (players.length - 1) / iterations,
                min: 100 * min / iterations,
                max: 100 * max / iterations
            };
        }

        if (player.length == 2 && players.length == 2) {
            player[0].score.min = player[0].score.avg;
            player[0].score.max = player[0].score.avg;

            player[1].score.avg = 100 - player[0].score.avg,
            player[1].score.min = player[1].score.avg;
            player[1].score.max = player[1].score.avg;
        }
    }

    // Tournament only
    simulateTournament (player, players, iterations) {
        for (var i = 0; i < player.length; i++) {
            player[i].score = {
                avg: 0,
                max: players.findIndex(p => p.index == player[i].index)
            };

            for (var j = 0; j < players.length; j++) {
                var s = 0;
                this.cache(player[i].player, players[j].player);
                for (var k = 0; k < iterations; k++) {
                    s += this.fight();
                }

                if (s > iterations / 2) {
                    player[i].score.avg++;
                } else {
                    break;
                }
            }
        }
    }

    // Fight 1v1s only
    simulateSingle (player, players, iterations) {
        var scores = [];
        for (var i = 0; i < players.length; i++) {
            if (player.player == players[i].player) {
                players[i].score = {
                    avg: 50
                };
            } else {
                var score = 0;
                this.cache(player.player, players[i].player);
                for (var j = 0; j < iterations; j++) {
                    score += this.fight();
                }

                players[i].score = {
                    avg: 100 * score / iterations
                };
            }
        }
    }

    // Cache Players initially
    cache (source, target) {
        this.ca = FighterModel.create(0, source);
        this.cb = FighterModel.create(1, target);

        this.ca.initialize(this.cb);
        this.cb.initialize(this.ca);

        this.as = this.ca.onFightStart(this.cb);
        this.bs = this.cb.onFightStart(this.ca);
    }

    fight () {
        this.a = this.ca;
        this.b = this.cb;

        if (FIGHT_DUMP_ENABLED) this.log(0);

        this.a.reset();
        this.b.reset();

        return super.fight();
    }
}
