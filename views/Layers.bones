view = Backbone.View.extend();

view.prototype.events = {
    'sortupdate ul.layers': 'sortLayers',
    'click a.add-layer': 'layerAdd',
    'click a.edit': 'layerEdit',
    'click a.inspect': 'layerInspect',
    'click a.delete': 'layerDelete'
};

view.prototype.initialize = function(options) {
    _(this).bindAll(
        'render',
        'layerAdd',
        'layerInspect',
        'layerEdit',
        'layerDelete',
        'makeLayer',
        'sortLayers'
    );
    this.model.bind('poll', this.render);
    this.render();
};

view.prototype.render = function() {
    this.$('.actions').html("<a href='#add' class='popup add-layer button'><span class='icon reverse plus labeled'></span> Add layer</a>");
    this.$('.content').html("<ul class='layers'></ul>");
    this.model.get('Layer').chain().each(this.makeLayer);
    this.$('ul').sortable({
        axis: 'y',
        handle: '.handle',
        containment: this.$('.content'),
        tolerance: 'pointer'
    });
};

view.prototype.makeLayer = function(model) {
    model.el = $(templates.ProjectLayer(model));

    // Prepend layers since intuitively the last drawn layer appears
    // "on top" of the other layers (painting model).
    this.$('ul').prepend(model.el);

    // Bind to the 'remove' event to teardown.
    model.bind('remove', _(function(model) {
        model.el.remove();
    }).bind(this));
    // Bind change event to retemplate.
    model.bind('change', _(function(model) {
        var update = $(templates.ProjectLayer(model));
        model.el.replaceWith(update);
        model.el = update;
    }).bind(this));
};

view.prototype.layerAdd = function(ev) {
    var cb = _(function(favorites) {
        var model = new models.Layer({}, {
            collection: this.model.get('Layer')
        })
        model.bind('add', this.makeLayer);
        new views.Layer({
            el: $('#popup'),
            model: model,
            favorites: favorites
        });
    }).bind(this);
    (new models.Favorites).fetch({success:cb,error:cb});
};

view.prototype.layerEdit = function(ev) {
    var cb = _(function(favorites) {
        var id = $(ev.currentTarget).attr('href').split('#').pop();
        new views.Layer({
            el: $('#popup'),
            model: this.model.get('Layer').get(id),
            favorites: favorites
        });
    }).bind(this);
    (new models.Favorites).fetch({success:cb,error:cb});
};

view.prototype.layerDelete = function(ev) {
    var id = $(ev.currentTarget).attr('href').split('#').pop();
    new views.Modal({
        content: 'Are you sure you want to delete layer "'+ id +'"?',
        callback: _(function() {
            var model = this.model.get('Layer').get(id);
            this.model.get('Layer').remove(model);
        }).bind(this),
        affirmative: 'Delete'
    });
    return false;
};

view.prototype.layerInspect = function(ev) {
    $('#drawer .content').empty();
    $('#drawer').addClass('loading');
    var id = $(ev.currentTarget).attr('href').split('#').pop();
    var layer = this.model.get('Layer').get(id);
    var model = new models.Datasource(_(layer.get('Datasource')).extend({
        id: layer.get('id'),
        project: this.model.get('id'),
        // millstone will not allow `srs` be undefined for inspection so we set
        // it to null. We could use the layer's SRS, but this likely has fewer
        // side effects.
        srs: null
    }));
    model.fetchFeatures({
        success: _(function(model) {
            $('#drawer').removeClass('loading');
            new views.Datasource({
                el: $('#drawer'),
                model: model,
                project: this.model
            });
        }).bind(this),
        error: function(model, err) {
            $('#drawer').removeClass('loading');
            new views.Modal(err);
        }
    });
};

view.prototype.sortLayers = function() {
    var order = _(this.$('ul li .actions a')).chain()
        .map(function(el) { return $(el).attr('href').split('#').pop(); })
        .uniq()
        .reverse()
        .value();
    this.model.get('Layer').models = this.model.get('Layer')
        .sortBy(function(model) { return _(order).indexOf(model.id) });
    this.model.get('Layer').trigger('change');
};

