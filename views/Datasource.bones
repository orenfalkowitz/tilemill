view = Backbone.View.extend();

view.prototype.events = {
    'click a[href=#back]': 'back',
    'click a.showall': 'showAll'
};

view.prototype.featureLimit = 100;

view.prototype.initialize = function(options) {
    this.render();
};

view.prototype.back = function() {
    $('.palette a[href=#layers]').click();
    return false;
};

view.prototype.render = function() {
    var features = this.model.get('features');
    this.$('.actions').html("<a href='#back' class='button'><span class='icon prev reverse labeled' title='layers'></span> Back</a>");
    this.$('.content').html(templates.Datasource({
        fields: this.model.get('fields'),
        features: _(features).first(this.featureLimit),
        more: _(features).size() > this.featureLimit
    }));
    return this;
};

view.prototype.showAll = function() {
    this.$('a.showall').hide();
    this.$('.content table tbody').append(templates.DatasourceRows({
        fields: this.model.get('fields'),
        features: _(this.model.get('features')).rest(this.featureLimit)
    }));
    return false;
}

