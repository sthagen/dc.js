import * as d3 from 'd3';

import {logger} from '../core/logger';
import {BaseMixin} from '../base/base-mixin';

const LABEL_CSS_CLASS = 'dc-grid-label';
const ITEM_CSS_CLASS = 'dc-grid-item';
const SECTION_CSS_CLASS = 'dc-grid-section dc-grid-group';
const GRID_CSS_CLASS = 'dc-grid-top';

/**
 * Data grid is a simple widget designed to list the filtered records, providing
 * a simple way to define how the items are displayed.
 *
 *
 * Note: Formerly the data grid chart (and data table) used the {@link dc.dataGrid#group group} attribute as a
 * keying function for {@link https://github.com/d3/d3-collection/blob/master/README.md#nest nesting} the data
 * together in sections.  This was confusing so it has been renamed to `section`, although `group` still works.
 *
 * Examples:
 * - {@link http://europarl.me/dc.js/web/ep/index.html List of members of the european parliament}
 * @class dataGrid
 * @memberof dc
 * @mixes dc.baseMixin
 * @param {String|node|d3.selection} parent - Any valid
 * {@link https://github.com/d3/d3-selection/blob/master/README.md#select d3 single selector} specifying
 * a dom block element such as a div; or a dom element or d3 selection.
 * @param {String} [chartGroup] - The name of the chart group this chart instance should be placed in.
 * Interaction with a chart will only trigger events and redraws within the chart's group.
 * @returns {dc.dataGrid}
 */
export class DataGrid extends BaseMixin {
    constructor (parent, chartGroup) {
        super();

        this._section = null;
        this._size = 999; // shouldn't be needed, but you might
        this._html = function (d) {
            return 'you need to provide an html() handling param:  ' + JSON.stringify(d);
        };
        this._sortBy = function (d) {
            return d;
        };
        this._order = d3.ascending;
        this._beginSlice = 0;
        this._endSlice = undefined;

        this._htmlSection = d => {
            return '<div class=\'' + SECTION_CSS_CLASS + '\'><h1 class=\'' + LABEL_CSS_CLASS + '\'>' +
                this.keyAccessor()(d) + '</h1></div>';
        };

        this._mandatoryAttributes(['dimension', 'section']);

        /**
         * Backward-compatible synonym for {@link dc.dataGrid#section section}.
         *
         * @method group
         * @memberof dc.dataGrid
         * @instance
         * @param {Function} groupFunction Function taking a row of data and returning the nest key.
         * @returns {Function|dc.dataGrid}
         */
        this.group = logger.annotate(this.section,
            'consider using dataGrid.section instead of dataGrid.group for clarity');

        /**
         * Backward-compatible synonym for {@link dc.dataGrid#htmlSection htmlSection}.
         * @method htmlGroup
         * @memberof dc.dataGrid
         * @instance
         * @param {Function} [htmlGroup]
         * @returns {Function|dc.dataGrid}
         */
        this.htmlGroup = logger.annotate(this.htmlSection,
            'consider using dataGrid.htmlSection instead of dataGrid.htmlGroup for clarity');

        this.anchor(parent, chartGroup);
    }

    _doRender () {
        this.selectAll('div.' + GRID_CSS_CLASS).remove();

        this._renderItems(this._renderSections());

        return this;
    };

    _renderSections () {
        const sections = this.root().selectAll('div.' + GRID_CSS_CLASS)
            .data(this._nestEntries(), d => this.keyAccessor()(d));

        const itemSection = sections
            .enter()
            .append('div')
            .attr('class', GRID_CSS_CLASS);

        if (this._htmlSection) {
            itemSection
                .html(d => this._htmlSection(d));
        }

        sections.exit().remove();
        return itemSection;
    };

    _nestEntries () {
        const entries = this.dimension().top(this._size);

        return d3.nest()
            .key(this.section())
            .sortKeys(this._order)
            .entries(
                entries
                    .sort((a, b) => this._order(this._sortBy(a), this._sortBy(b)))
                    .slice(this._beginSlice, this._endSlice)
            );
    };

    _renderItems (sections) {
        let items = sections.order()
            .selectAll('div.' + ITEM_CSS_CLASS)
            .data(function (d) {
                return d.values;
            });

        items.exit().remove();

        items = items
            .enter()
            .append('div')
            .attr('class', ITEM_CSS_CLASS)
            .html(d => this._html(d))
            .merge(items);

        return items;
    };

    _doRedraw () {
        return this._doRender();
    };

    /**
     * Get or set the section function for the data grid. The section function takes a data row and
     * returns the key to specify to {@link https://github.com/d3/d3-collection/blob/master/README.md#nest d3.nest}
     * to split rows into sections.
     *
     * Do not pass in a crossfilter section as this will not work.
     * @method section
     * @memberof dc.dataGrid
     * @instance
     * @example
     * // section rows by the value of their field
     * chart
     *     .section(function(d) { return d.field; })
     * @param {Function} section Function taking a row of data and returning the nest key.
     * @returns {Function|dc.dataGrid}
     */
    section (section) {
        if (!arguments.length) {
            return this._section;
        }
        this._section = section;
        return this;
    };

    /**
     * Get or set the index of the beginning slice which determines which entries get displayed by the widget.
     * Useful when implementing pagination.
     * @method beginSlice
     * @memberof dc.dataGrid
     * @instance
     * @param {Number} [beginSlice=0]
     * @returns {Number|dc.dataGrid}
     */
    beginSlice (beginSlice) {
        if (!arguments.length) {
            return this._beginSlice;
        }
        this._beginSlice = beginSlice;
        return this;
    };

    /**
     * Get or set the index of the end slice which determines which entries get displayed by the widget.
     * Useful when implementing pagination.
     * @method endSlice
     * @memberof dc.dataGrid
     * @instance
     * @param {Number} [endSlice]
     * @returns {Number|dc.dataGrid}
     */
    endSlice (endSlice) {
        if (!arguments.length) {
            return this._endSlice;
        }
        this._endSlice = endSlice;
        return this;
    };

    /**
     * Get or set the grid size which determines the number of items displayed by the widget.
     * @method size
     * @memberof dc.dataGrid
     * @instance
     * @param {Number} [size=999]
     * @returns {Number|dc.dataGrid}
     */
    size (size) {
        if (!arguments.length) {
            return this._size;
        }
        this._size = size;
        return this;
    };

    /**
     * Get or set the function that formats an item. The data grid widget uses a
     * function to generate dynamic html. Use your favourite templating engine or
     * generate the string directly.
     * @method html
     * @memberof dc.dataGrid
     * @instance
     * @example
     * chart.html(function (d) { return '<div class='item '+data.exampleCategory+''>'+data.exampleString+'</div>';});
     * @param {Function} [html]
     * @returns {Function|dc.dataGrid}
     */
    html (html) {
        if (!arguments.length) {
            return this._html;
        }
        this._html = html;
        return this;
    };

    /**
     * Get or set the function that formats a section label.
     * @method htmlSection
     * @memberof dc.dataGrid
     * @instance
     * @example
     * chart.htmlSection (function (d) { return '<h2>'.d.key . 'with ' . d.values.length .' items</h2>'});
     * @param {Function} [htmlSection]
     * @returns {Function|dc.dataGrid}
     */
    htmlSection (htmlSection) {
        if (!arguments.length) {
            return this._htmlSection;
        }
        this._htmlSection = htmlSection;
        return this;
    };

    /**
     * Get or set sort-by function. This function works as a value accessor at the item
     * level and returns a particular field to be sorted.
     * @method sortBy
     * @memberof dc.dataGrid
     * @instance
     * @example
     * chart.sortBy(function(d) {
     *     return d.date;
     * });
     * @param {Function} [sortByFunction]
     * @returns {Function|dc.dataGrid}
     */
    sortBy (sortByFunction) {
        if (!arguments.length) {
            return this._sortBy;
        }
        this._sortBy = sortByFunction;
        return this;
    };

    /**
     * Get or set sort the order function.
     * @method order
     * @memberof dc.dataGrid
     * @instance
     * @see {@link https://github.com/d3/d3-array/blob/master/README.md#ascending d3.ascending}
     * @see {@link https://github.com/d3/d3-array/blob/master/README.md#descending d3.descending}
     * @example
     * chart.order(d3.descending);
     * @param {Function} [order=d3.ascending]
     * @returns {Function|dc.dataGrid}
     */
    order (order) {
        if (!arguments.length) {
            return this._order;
        }
        this._order = order;
        return this;
    };
}

export const dataGrid = (parent, chartGroup) => new DataGrid(parent, chartGroup);