var amp = require('amp');

module.exports = amp.Class.extend({
    /* Database Connection */
    db: false,

    /* Database Engine and Location */
    engine: 'models/engines/' + amp.config['database']['engine'],

    /* Relationships */
    hasOne: false,
    hasMany: false,
    belongsTo: false,
    habtm: false,

    validations: {},

    init: function () {
        var key;

        this.db = this.db || amp.require(this.engine);

        if (!this.db) {
            amp.error(503, 'Connection Unsuccessful');
        }
    }
});