class FloatingPopup {
    constructor (opacity = 0.85) {
        this.opacity = opacity;
    }

    open (...args) {
        return new Promise((resolve, reject) => {
            if (this.shouldOpen) {
                this.resolve = resolve;

                if (!this._hasParent()) {
                    const modal = $(this._createModal()).addClass('active');
                    const container = $(`
                        <div style="display: none; z-index: 999; position: fixed; width: 100vw; height: 100vh; left: 0; top: 0; display: flex; align-items: center; justify-content: center; background: rgba(0, 0, 0, ${this.opacity})">
                        </div>
                    `);

                    modal.appendTo(container);
                    container.appendTo($('body').first());
                    this.$parent = container;

                    this._createModal();
                    this._createBindings();
                }

                this._applyArguments(...args);
                this.$parent.show();
            } else {
                resolve();
            }
        });
    }

    close (value) {
        this.shouldOpen = false;
        if (this._hasParent() && this.resolve) {
            this.$parent.hide();
            this.resolve(value);
            this.resolve = undefined;
        }
    }

    openable () {
        this.shouldOpen = true;
    }

    _hasParent () {
        return typeof this.$parent !== 'undefined';
    }

    _applyArguments () {

    }

    _createModal () {
        return '';
    }

    _createBindings () {

    }
}

const PopupController = new (class {
    constructor () {
        this.queue = [];
        this.promise = Promise.resolve();
    }

    open (popup, ...args) {
        popup.openable();
        return (this.promise = this.promise.then(() => popup.open(...args)));
    }

    close (popup) {
        popup.close();
    }
})();

const TermsAndConditionsPopup = new (class extends FloatingPopup {
    _createModal () {
        return `
            <div class="ui basic tiny modal" style="background-color: #0b0c0c; padding: 1em; margin: -2em; border-radius: 0.5em;">
                <h2 class="ui centered header" style="padding-bottom: 0.5em; padding-top: 0; text-decoration: underline;">Terms and Conditions</h2>
                <div style="height: 65vh; overflow-y: auto;">
                    <h4 class="ui centered header" style="padding-top: 0; color: orange;">§1 General use</h4>
                    <ul style="margin-top: 0; line-height: 1.3em;">
                        <li>It is advised to never share HAR files as they <b>might</b> contain private data such as IP address and cookies.</li>
                        <li style="margin-top: 0.5em;">The site is distributed <b>AS IS</b> wthout any warranties. You are fully responsible for use of this site.</li>
                        <li style="margin-top: 0.5em;">You're free to share, copy and modify the site, but you are not allowed to distribute it or any of it's parts without explicit approval.</li>
                        <li style="margin-top: 0.5em;">You agree to limit data collection from the game to reasonable amounts.</li>
                        <li style="margin-top: 0.5em;">You agree to follow the Shakes & Fidget <a href="https://cdn.playa-games.com/res/sfgame3/legal/html/terms_en.html">Terms and Conditions</a></li>
                        <li style="margin-top: 0.5em;">You are not allowed to automate any part of this tool.</li>
                    </ul>
                    <h4 class="ui centered header" style="padding-top: 0; color: orange;">§2 Endpoint</h4>
                    <ul style="margin-top: 0; line-height: 1.3em;">
                        <li>Endpoint is a Unity application bundled with the tool that allows you to log into the game and collect limited data about yourself and your guild members without the lengthy process of creating a HAR file.</li>
                        <li style="margin-top: 0.5em;">It is not possible to capture any other players than those listed above.</li>
                        <li style="margin-top: 0.5em;">Everything happens locally in a identical way to playing the game through browser.</li>
                    </ul>
                    <h4 class="ui centered header" style="padding-top: 0; color: orange;">§3 Integrated share service</h4>
                    <ul style="margin-top: 0; line-height: 1.3em;">
                        <li>All data shared via the integrated share function is not protected in any other way other than the share key.</li>
                        <li style="margin-top: 0.5em;">The shared data might be deleted at any point of time, up to full 2 days.</li>
                    </ul>
                    <h4 class="ui centered header" style="padding-top: 0; color: orange;">§4 Sentry</h4>
                    <ul style="margin-top: 0; line-height: 1.3em;">
                        <li>All errors raised during use of this tool will be reported via Sentry.io tool.</li>
                        <li style="margin-top: 0.5em;">These reports are anonymous so that it's not possible to track their origin.</li>
                        <li style="margin-top: 0.5em;">Please note that certain ad-blockers might prevent Sentry from working.</li>
                        <li style="margin-top: 0.5em;">If you want to contribute to this project I recommend disabling ad-blockers for this site.</li>
                    </ul>
                </div>
                <button class="ui green fluid button" style="margin-top: 1em;" data-op="accept">I understand & accept these terms</button>
            </div>
        `;
    }

    _createBindings () {
        this.$parent.find('[data-op="accept"]').click(() => {
            SiteOptions.terms_accepted = true;
            this.close();
        });
    }
})();

const ChangeLogPopup = new (class extends FloatingPopup {
    _createModal () {
        const release = MODULE_VERSION;
        const entries = CHANGELOG[release];

        let content = '';
        if (Array.isArray(entries)) {
            for (const entry of entries) {
                content += `
                    <li style="margin-top: 0.5em;">${entry}</li>
                `
            }
        } else if (entries) {
            for (const [ category, changes ] of Object.entries(entries)) {
                content += `<h4 class="ui header" style="color: orange; margin-left: -1em; margin-bottom: 0;">${category}</h4>`
                for (const entry of changes) {
                    content += `
                        <li style="margin-top: 0.5em;">${entry}</li>
                    `
                }
            }
        } else {
            content = '<p style="text-align: center; margin-top: 20%; margin-bottom: 20%;"><b>Changes are yet to be announced</b></p>'
        }

        return `
            <div class="ui tiny basic modal" style="background-color: #0b0c0c; padding: 1em; margin: -2em; border-radius: 0.5em;">
                <h2 class="ui centered header" style="padding-top: 0; padding-bottom: 0.5em;">Release <span style="color: orange;">${release}</span></h2>
                <div style="text-align: left; line-height: 1.3em; margin-left: -18px; max-height: 50vh; overflow-y: scroll;">
                    <ul>
                        ${content}
                    </ul>
                </div>
                <button class="ui black fluid button" style="margin-top: 2em;" data-op="accept">Continue</button>
            </div>
        `;
    }

    _createBindings () {
        this.$parent.find('[data-op="accept"]').click(() => {
            SiteOptions.version_accepted = MODULE_VERSION;
            this.close();
        });
    }
})();

const PendingMigrationPopup = new (class extends FloatingPopup {
    _createModal () {
        return `
            <div class="ui basic mini modal" style="background-color: #0b0c0c; padding: 1em; margin: -2em; border-radius: 0.5em;">
                <h2 class="ui centered header" style="padding-bottom: 0.5em; padding-top: 0;">Migrate your data over to <span style="color: orange;">SFTools V5</span></h2>
                <div style="text-align: justify; margin-top: 1em; line-height: 1.3em;">
                    A migration is needed in order for you to be able to use your previously stored data.
                </div>
                <div style="text-align: justify; margin-top: 1em; line-height: 1.3em;">
                    If you want to attempt the migration without possibly causing any permanent damage, press the Try button. After you verify that everything is in order you can relaunch the tool and press Continue.
                </div>
                <div style="text-align: justify; margin-top: 1em; line-height: 1.3em;">
                    To proceed with the migration fully, click Continue button. Be aware that this is a destructive operation and after the migration finishes you won't be able to use your data with the previous versions of this tool.
                </div>
                <div style="text-align: justify; margin-top: 1em; line-height: 1.3em; margin-bottom: 2em;">
                    If the migration fails, please reload the site and click the Skip button. You will gain access to the site and your data won't be affected. You will need to wait until the issue is resolved or contact the support at support@mar21.eu.
                </div>
                <div class="ui three fluid buttons">
                    <button class="ui black fluid button" data-op="skip">Skip</button>
                    <button class="ui orange fluid button" data-op="try">Try</button>
                    <button class="ui red fluid button" data-op="accept">Continue</button>
                </div>
            </div>
        `;
    }

    _createBindings () {
        this.$parent.find('[data-op="try"]').click(() => {
            SiteOptions.migration_allowed = true;
            SiteOptions.migration_accepted = false;
            this.close();
        });

        this.$parent.find('[data-op="accept"]').click(() => {
            SiteOptions.migration_allowed = true;
            SiteOptions.migration_accepted = true;
            this.close();
        });

        this.$parent.find('[data-op="skip"]').click(() => {
            SiteOptions.migration_allowed = false;
            SiteOptions.migration_accepted = false;
            this.close();
        });
    }
})();

const LoaderPopup = new (class extends FloatingPopup {
    constructor () {
        super(0);
    }

    _createModal () {
        return `
            <div class="ui basic modal" style="text-align: center;">
                <img src="res/favicon.png" class="sftools-loader" width="100">
            </div>
        `;
    }
})();

// Non-blocking popup about an exception that occured
const WarningPopup = new (class extends FloatingPopup {
    constructor () {
        super(0);
    }

    _createModal () {
        return `
            <div class="ui basic tiny modal" style="background-color: #0b0c0c; padding: 1em; margin: -2em; border-radius: 0.5em;">
                <h2 class="ui centered header" style="padding-bottom: 0.5em; padding-top: 0;"><i class="exclamation triangle icon" style="color: orange; font-size: 1em; line-height: 0.75em;"></i> An issue has occured!</h2>
                <div class="text-center" style="text-align: justify; margin-top: 1em; line-height: 1.3em; margin-bottom: 2em;" data-op="text">
                    ...
                </div>
                <button class="ui black fluid button" data-op="continue">Continue</button>
            </div>
        `;
    }

    _createBindings () {
        this.$text = this.$parent.find('[data-op="text"]');
        this.$parent.find('[data-op="continue"]').click(() => this.close());
    }

    _applyArguments (error) {
        this.$text.text(error instanceof Error ? error.message : error);
    }
})();

// Blocking popup about an exception that occured and is blocking execution
const ErrorPopup = new (class extends FloatingPopup {
    _createModal () {
        return `
            <div class="ui basic tiny modal" style="background-color: #0b0c0c; padding: 1em; margin: -2em; border-radius: 0.5em;">
                <h2 class="ui centered header" style="padding-bottom: 0.5em; padding-top: 0;"><i class="times circle icon" style="color: red; font-size: 1em; line-height: 0.75em;"></i> A fatal error has occured!</h2>
                <div class="text-center" style="text-align: justify; margin-top: 1em; line-height: 1.3em; margin-bottom: 2em;" data-op="text">
                    ...
                </div>
                <div style="margin-top: 2em;">
                    <div class="text-center" style="text-align: justify; margin-top: 1em; line-height: 1.3em; margin-bottom: 2em;">
                        <h4 class="ui white header">This error might have also been caused by your current profile.<br>
                        Click the revert button below to revert back to default profile.</h4>
                    </div>
                </div>
                <div class="ui two buttons">
                    <button class="ui red fluid button" data-op="continue">Click here or refresh the page</button>
                    <button class="ui red fluid button" data-op="continue-default">Revert back to default profile</button>
                </div>
            </div>
        `;
    }

    _createBindings () {
        this.$text = this.$parent.find('[data-op="text"]');
        this.$parent.find('[data-op="continue"]').click(() => {
            window.location.href = window.location.href;
        });

        this.$parent.find('[data-op="continue-default"]').click(() => {
            ProfileManager.setActiveProfile('default');
            window.location.href = window.location.href;
        });
    }

    _applyArguments (error) {
        this.$text.html(error instanceof Error ? error.message : error);
    }
})();

const FileEditPopup = new (class extends FloatingPopup {
    constructor () {
        super(0);
    }

    _createModal () {
        return `
            <div class="ui basic tiny modal" style="background-color: #ffffff; padding: 1em; margin: -2em; border-radius: 0.5em; border: 1px solid #0b0c0c;">
                <h2 class="ui header" style="color: black; padding-bottom: 0.5em; padding-top: 0; padding-left: 0;">Edit file</h2>
                <div class="ui form" style="margin-top: 1em; line-height: 1.3em; margin-bottom: 2em;">
                    <div class="field">
                        <label>Timestamp</label>
                        <input data-op="timestamp" type="text">
                    </div>
                </div>
                <div class="ui three fluid buttons">
                    <button class="ui black fluid button" data-op="cancel">Cancel</button>
                    <button class="ui fluid button" style="background-color: orange; color: black;" data-op="save">Save</button>
                </div>
            </div>
        `;
    }

    _createBindings () {
        this.$parent.find('[data-op="cancel"]').click(() => {
            this.close();
        });

        this.$parent.find('[data-op="save"]').click(() => {
            const newTimestamp = Math.trunc(parseOwnDate(this.$timestamp.val()) / 60000);
            if (newTimestamp && newTimestamp != this.truncatedTimestamp) {
                this.close();
                PopupController.open(LoaderPopup);
                DatabaseManager.rebase(this.sourceTimestamp, newTimestamp * 60000).then(this.callback);
            } else {
                this.close();
            }
        });

        this.$timestamp = this.$parent.find('[data-op="timestamp"]')
    }

    _applyArguments (timestamp, callback) {
        this.callback = callback;
        this.sourceTimestamp = timestamp;
        this.truncatedTimestamp = Math.trunc(timestamp / 60000);
        this.$timestamp.val(formatDate(timestamp));
    }
})();

const FileTagPopup = new (class extends FloatingPopup {
    constructor () {
        super(0);
    }

    _createModal () {
        return `
            <div class="ui basic mini modal" style="background-color: #ffffff; padding: 1em; margin: -2em; border-radius: 0.5em; border: 1px solid #0b0c0c;">
                <h2 class="ui header" style="color: black; padding-bottom: 0.5em; padding-top: 0; padding-left: 0;">Edit tags</h2>
                <div class="ui form" style="margin-top: 1em; line-height: 1.3em; margin-bottom: 2em;">
                    <div class="field">
                        <label>Current tags:</label>
                        <input data-op="old-tags" type="text" placeholder="None" disabled>
                    </div>
                    <div class="field">
                        <label>Replacement tag:</label>
                        <input data-op="new-tags" type="text" placeholder="None">
                    </div>
                </div>
                <div class="ui three fluid buttons">
                    <button class="ui black fluid button" data-op="cancel">Cancel</button>
                    <button class="ui fluid button" style="background-color: orange; color: black;" data-op="save">Save</button>
                </div>
            </div>
        `;
    }

    _createBindings () {
        this.$oldTags = this.$parent.find('[data-op="old-tags"]');
        this.$newTags = this.$parent.find('[data-op="new-tags"]');

        this.$parent.find('[data-op="cancel"]').click(() => {
            this.close();
        });

        this.$parent.find('[data-op="save"]').click(() => {
            const tag = this.$newTags.val().trim();
            this.close();
            PopupController.open(LoaderPopup);
            DatabaseManager.setTag(this.timestamps, tag).then(this.callback);
        });
    }

    _applyArguments (timestamps, callback) {
        this.timestamps = timestamps;
        this.callback = callback;

        const tags = Object.entries(DatabaseManager.findUsedTags(timestamps));
        if (tags.length == 1) {
            const tag = _dig(tags, 0, 0);
            if (tag == 'undefined') {
                this.$oldTags.val('');
            } else {
                this.$oldTags.val(tag);
            }
        } else {
            this.$oldTags.val(tags.map(([key, count]) => `${key === 'undefined' ? 'None' : key} (${count})`).join(', '));
        }

        this.$newTags.val('');
    }
})();

const ProfileCreatePopup = new (class extends FloatingPopup {

    constructor () {
        super(0);
    }

    _createModal () {
        return `
            <div class="ui small modal" style="background-color: #ffffff; padding: 1em; margin: -2em; border-radius: 0.5em; border: 1px solid #0b0c0c;">
                <h2 class="ui header" style="color: black; padding-bottom: 0.5em; padding-top: 0; padding-left: 0;">Create/Edit profile</h2>
                <div class="ui form" style="margin-top: 1em; line-height: 1.3em; margin-bottom: 2em;">
                    <div class="two fields">
                        <div class="four wide field">
                            <label>ID:</label>
                            <input class="text-center" data-op="id" type="text" disabled>
                        </div>
                        <div class="twelve wide field">
                            <label>Name:</label>
                            <input data-op="name" type="text">
                        </div>
                    </div>
                    <h3 class="ui header" style="margin-bottom: 0.5em; margin-top: 0;">Primary filter configuration</h3>
                    <div class="two fields">
                        <div class="field">
                            <label>Index:</label>
                            <div class="ui fluid search selection dropdown" data-op="primary-index">
                                <div class="text"></div>
                                <i class="dropdown icon"></i>
                            </div>
                        </div>
                        <div class="field">
                            <label>Operation:</label>
                            <select class="ui fluid search selection dropdown" data-op="primary-operator">
                                <option value="equals">Equals</option>
                                <option value="above">Above</option>
                                <option value="below">Below</option>
                                <option value="between">Between</option>
                            </select>
                        </div>
                    </div>
                    <div class="two fields">
                        <div class="field">
                            <label>Value 1:</label>
                            <div class="ta-wrapper" style="height: initial;">
                                <input class="ta-area" data-op="primary" type="text" placeholder="Primary AST expression">
                                <div data-op="primary-content" class="ta-content" style="width: 100%; margin-top: -2em; margin-left: 1em;"></div>
                            </div>
                        </div>
                        <div class="field">
                            <label>Value 2:</label>
                            <div class="ta-wrapper" style="height: initial;">
                                <input class="ta-area" data-op="primary-2" type="text" placeholder="Primary AST expression (optional)">
                                <div data-op="primary-content-2" class="ta-content" style="width: 100%; margin-top: -2em; margin-left: 1em;"></div>
                            </div>
                        </div>
                    </div>
                    <h3 class="ui header" style="margin-bottom: 0.5em; margin-top: 0;">Secondary filter configuration</h3>
                    <div class="field">
                        <label>Secondary filter:</label>
                        <div class="ta-wrapper">
                            <input class="ta-area" data-op="secondary" type="text" placeholder="Secondary AST expression">
                            <div data-op="secondary-content" class="ta-content" style="width: 100%; margin-top: -2em; margin-left: 1em;"></div>
                        </div>
                    </div>
                </div>
                <div class="ui three fluid buttons">
                    <button class="ui black fluid button" data-op="cancel">Cancel</button>
                    <button class="ui fluid button" style="background-color: orange; color: black;" data-op="save">Save</button>
                </div>
            </div>
        `;
    }

    _createBindings () {
        this.$id = this.$parent.find('[data-op="id"]');
        this.$name = this.$parent.find('[data-op="name"]');

        // Secondary filter
        this.$secondary = this.$parent.find('[data-op="secondary"]');
        this.$secondaryContent = this.$parent.find('[data-op="secondary-content"]');

        this.$secondary.on('change input', (e) => {
            this.$secondaryContent.html(Expression.format($(e.currentTarget).val() || '', undefined, PROFILES_PROPS));
        });

        // Primary filter
        this.$primaryIndex = this.$parent.find('[data-op="primary-index"]');
        this.$primaryOperator = this.$parent.find('[data-op="primary-operator"]');
        this.$primary = this.$parent.find('[data-op="primary"]');
        this.$primaryContent = this.$parent.find('[data-op="primary-content"]');
        this.$primary2 = this.$parent.find('[data-op="primary-2"]');
        this.$primaryContent2 = this.$parent.find('[data-op="primary-content-2"]');

        this.$primary.on('change input', (e) => {
            this.$primaryContent.html(Expression.format($(e.currentTarget).val() || ''));
        });

        this.$primary2.on('change input', (e) => {
            this.$primaryContent2.html(Expression.format($(e.currentTarget).val() || ''));
        });

        this.$primaryIndex.dropdown({
            values: ['none', ...PROFILES_INDEXES].map(v => {
                return {
                    name: v.charAt(0).toUpperCase() + v.slice(1),
                    value: v,
                    selected: v === 'none'
                };
            })
        }).dropdown('setting', 'onChange', (value, text) => {
            if (value === 'none') {
                this.$primaryOperator.closest('.field').addClass('disabled');
                this.$primary.val('').trigger('change').closest('.field').addClass('disabled');
                this.$primary2.val('').trigger('change').closest('.field').addClass('disabled');
            } else {
                this.$primaryOperator.closest('.field').removeClass('disabled');
                this.$primary.closest('.field').removeClass('disabled');
                if (this.$primaryOperator.dropdown('get value') === 'between') {
                    this.$primary2.closest('.field').removeClass('disabled');
                }
            }
        }).dropdown('set selected', 'none');

        this.$primaryOperator.dropdown('setting', 'onChange', (value, text) => {
            if (value === 'between') {
                this.$primary2.closest('.field').removeClass('disabled');
            } else {
                this.$primary2.closest('.field').addClass('disabled');
            }
        }).dropdown('set selected', 'equals');

        this.$parent.find('[data-op="cancel"]').click(() => {
            this.close();
        });

        this.$parent.find('[data-op="save"]').click(() => {
            const primaryName = this.$primaryIndex.dropdown('get value');
            const primaryMode = this.$primaryOperator.dropdown('get value');
            const primaryValue = this.$primary.val();
            const primaryValue2 = this.$primary2.val();

            ProfileManager.setProfile(this.id, Object.assign(this.profile || {}, {
                name: this.$name.val(),
                primary: primaryName === 'none' ? null : {
                    name: primaryName,
                    mode: primaryMode,
                    value: primaryMode === 'between' ? [ primaryValue, primaryValue2 ] : [ primaryValue ]
                },
                secondary: this.$secondary.val()
            }));
            this.close();
            this.callback();
        });
    }

    _applyArguments (callback, id) {
        this.callback = callback;
        this.id = id || SHA1(String(Date.now())).slice(0, 4);
        this.profile = undefined;

        if (id) {
            this.profile = ProfileManager.getProfile(id);

            const { name, primary, secondary } = this.profile;
            this.$id.val(id);

            if (primary) {
                const { mode, name, value } = primary;

                this.$primaryIndex.dropdown('set selected', name);
                this.$primaryOperator.dropdown('set selected', mode);
                this.$primary.val(value[0] || '').trigger('change');
                this.$primary2.val(value[1] || '').trigger('change');
            } else {
                this.$primaryIndex.dropdown('set selected', 'none');
                this.$primaryOperator.dropdown('set selected', 'equals');
                this.$primary.val('').trigger('change');
                this.$primary2.val('').trigger('change');
            }

            this.$secondary.val(secondary).trigger('change');
            this.$name.val(name);
        } else {
            this.$id.val(this.id);
            this.$primaryIndex.dropdown('set selected', 'none');
            this.$primaryOperator.dropdown('set selected', 'equals');
            this.$primary.val('').trigger('change');
            this.$primary2.val('').trigger('change');
            this.$secondary.val('').trigger('change');
            this.$name.val('');
        }
    }
})();

// Automatically open Terms and Conditions if not accepted yet
window.addEventListener('load', function() {
    if (PreferencesHandler._isAccessible()) {
        if (!SiteOptions.terms_accepted) {
            PopupController.open(TermsAndConditionsPopup);
        }

        if (SiteOptions.version_accepted != MODULE_VERSION) {
            PopupController.open(ChangeLogPopup);
        }
    }
});
