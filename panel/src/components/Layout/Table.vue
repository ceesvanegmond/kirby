<template>
	<div :aria-disabled="disabled" class="k-table">
		<table :data-disabled="disabled" :data-indexed="hasIndexColumn">
			<!-- Header row -->
			<thead>
				<tr>
					<th v-if="hasIndexColumn" data-mobile class="k-table-index-column">
						#
					</th>

					<th
						v-for="(column, columnIndex) in columns"
						:key="columnIndex + '-header'"
						:data-align="column.align"
						:data-mobile="column.mobile"
						:style="{ width: width(column.width) }"
						class="k-table-column"
						@click="
							onHeader({
								column,
								columnIndex
							})
						"
					>
						<slot
							name="header"
							v-bind="{
								column,
								columnIndex,
								label: label(column, columnIndex)
							}"
						>
							{{ label(column, columnIndex) }}
						</slot>
					</th>

					<th v-if="hasOptions" data-mobile class="k-table-options-column"></th>
				</tr>
			</thead>

			<k-draggable
				:list="values"
				:options="dragOptions"
				:handle="true"
				element="tbody"
				@change="onChange"
				@end="onSort"
			>
				<!-- Empty -->
				<tr v-if="rows.length === 0">
					<td :colspan="colspan" class="k-table-empty">
						{{ empty }}
					</td>
				</tr>

				<!-- Rows -->
				<template v-else>
					<tr v-for="(row, rowIndex) in values" :key="rowIndex">
						<!-- Index & drag handle -->
						<td
							v-if="hasIndexColumn"
							:data-sortable="sortable && row.sortable !== false"
							data-mobile
							class="k-table-index-column"
						>
							<slot
								name="index"
								v-bind="{
									row,
									rowIndex
								}"
							>
								<div class="k-table-index" v-text="index + rowIndex" />
							</slot>

							<k-sort-handle
								v-if="sortable && row.sortable !== false"
								class="k-table-sort-handle"
							/>
						</td>

						<!-- Cell -->
						<k-table-cell
							v-for="(column, columnIndex) in columns"
							:key="rowIndex + '-' + columnIndex"
							:column="column"
							:field="fields[columnIndex]"
							:row="row"
							:mobile="column.mobile"
							:value="row[columnIndex]"
							:style="{ width: width(column.width) }"
							class="k-table-column"
							@click.native="
								onCell({
									row,
									rowIndex,
									column,
									columnIndex
								})
							"
							@input="
								onCellUpdate({
									columnIndex,
									rowIndex,
									value: $event
								})
							"
						/>

						<!-- Options -->
						<td v-if="hasOptions" data-mobile class="k-table-options-column">
							<slot name="options" v-bind="{ row, rowIndex }">
								<k-options-dropdown
									:options="row.options ?? options"
									:text="(row.options ?? options).length > 1"
									@option="onOption($event, row, rowIndex)"
								/>
							</slot>
						</td>
					</tr>
				</template>
			</k-draggable>
		</table>

		<k-pagination
			v-if="pagination"
			class="k-table-pagination"
			v-bind="pagination"
			@paginate="$emit('paginate', $event)"
		/>
	</div>
</template>

<script>
/**
 * A simple table component with columns and rows
 */
export default {
	inheritAttrs: false,
	props: {
		/**
		 * Configuration which columns to include.
		 * @value name: { after, before, label, type, width }
		 * @example { title: { label: "title", type: "text" } }
		 */
		columns: {
			type: Object,
			default: () => ({})
		},
		/**
		 * Whether table is disabled
		 */
		disabled: Boolean,
		/**
		 * Optional fields configuration that can be used as columns
		 * (used for our structure field)
		 */
		fields: {
			type: Object,
			default: () => ({})
		},
		/**
		 * Text to display when table has no rows
		 */
		empty: String,
		/**
		 * Index number for first row
		 */
		index: {
			type: [Number, Boolean],
			default: 1
		},
		/**
		 * Array of table rows
		 */
		rows: Array,
		/**
		 * What options to include in dropdown
		 */
		options: {
			default: () => [],
			type: [Array, Function]
		},
		/**
		 * Optional pagination settings
		 */
		pagination: [Object, Boolean],
		/**
		 * Whether table is sortable
		 */
		sortable: Boolean
	},
	data() {
		return {
			values: this.rows
		};
	},
	computed: {
		/**
		 * Number of all columns including index and options
		 * @returns {number}
		 */
		colspan() {
			let span = this.columnsCount;

			if (this.hasIndexColumn) {
				span++;
			}

			if (this.hasOptions) {
				span++;
			}

			return span;
		},
		/**
		 * Number of columns
		 * @returns {number}
		 */
		columnsCount() {
			return this.$helper.object.length(this.columns);
		},
		/**
		 * Config options for `k-draggable`
		 * @returns {Object}
		 */
		dragOptions() {
			return {
				disabled: !this.sortable,
				fallbackClass: "k-table-row-fallback",
				ghostClass: "k-table-row-ghost"
			};
		},
		/**
		 * Whether to show index column
		 * @returns {bool}
		 */
		hasIndexColumn() {
			return this.sortable || this.index !== false;
		},
		/**
		 * Whether to show options column
		 * @returns {bool}
		 */
		hasOptions() {
			return (
				this.$scopedSlots.options ||
				this.options?.length > 0 ||
				Object.values(this.values).filter((row) => row?.options).length > 0
			);
		}
	},
	watch: {
		rows() {
			this.values = this.rows;
		}
	},
	methods: {
		/**
		 * Checks if specific column is fully empty
		 * @param {number} columnIndex
		 * @returns {bool}
		 */
		isColumnEmpty(columnIndex) {
			return (
				this.rows.filter(
					(row) => this.$helper.object.isEmpty(row[columnIndex]) === false
				).length === 0
			);
		},
		/**
		 * Returns label for a column
		 * @param {Object} column
		 * @param {number} columnIndex
		 * @returns {string}
		 */
		label(column, columnIndex) {
			return column.label ?? this.$helper.string.ucfirst(columnIndex);
		},
		/**
		 * When the table has been sorted,
		 * emit changed item with event details
		 */
		onChange(event) {
			this.$emit("change", event);
		},
		/**
		 * When a table cell is clicked
		 * @param {mixed} params
		 */
		onCell(params) {
			this.$emit("cell", params);
		},
		/**
		 * When a cell updates (via inline editing)
		 * @param {Object} object with column index, row index and new value
		 */
		onCellUpdate({ columnIndex, rowIndex, value }) {
			this.values[rowIndex][columnIndex] = value;
			this.$emit("input", this.values);
		},
		/**
		 * When a header cell is clicked
		 * @param {mixed} params
		 */
		onHeader(params) {
			this.$emit("header", params);
		},
		/**
		 * When an option from the dropdown is engaged
		 * @param {string} option
		 * @param {Object} row
		 * @param {number} rowIndex
		 */
		onOption(option, row, rowIndex) {
			this.$emit("option", option, row, rowIndex);
		},
		/**
		 * When the table has been sorted,
		 * emit all items in new order
		 */
		onSort() {
			this.$emit("input", this.values);
			this.$emit("sort", this.values);
		},
		/**
		 * Returns width styling based on column fraction
		 * @param {string} fraction
		 */
		width(fraction) {
			if (typeof fraction !== "string") {
				return "auto";
			}

			if (fraction.includes("/") === false) {
				return fraction;
			}

			return this.$helper.ratio(fraction, "auto", false);
		}
	}
};
</script>

<style>
:root {
	--table-cell-padding: var(--spacing-3);
	--table-color-back: var(--color-white);
	--table-color-border: var(--color-background);
	--table-color-hover: var(--color-gray-100);
	--table-color-th-back: var(--color-gray-100);
	--table-color-th-text: var(--color-text-dimmed);
	--table-row-height: var(--input-height);
}

/* Table Layout */
.k-table {
	position: relative;
	background: var(--table-color-back);
	box-shadow: var(--shadow);
	border-radius: var(--rounded);
}

.k-table table {
	table-layout: fixed;
}

/* All Cells */
.k-table th,
.k-table td {
	padding-inline: var(--table-cell-padding);
	height: var(--table-row-height);
	overflow: hidden;
	text-overflow: ellipsis;
	width: 100%;
	border-inline-end: 1px solid var(--table-color-border);
	line-height: 1.25;
}
.k-table tr > *:last-child {
	border-inline-end: 0;
}

.k-table th,
.k-table tr:not(:last-child) td {
	border-block-end: 1px solid var(--table-color-border);
}

/* Text aligment */
.k-table :where(td, th)[data-align] {
	text-align: var(--align);
}

/* TH */
.k-table th {
	padding-inline: var(--table-cell-padding);
	font-family: var(--font-mono);
	font-size: var(--text-xs);
	color: var(--table-color-th-text);
	background: var(--table-color-th-back);
}
.k-table th[data-has-button] {
	padding: 0;
}
.k-table th button {
	padding-inline: var(--table-cell-padding);
	height: 100%;
	width: 100%;
	border-radius: var(--rounded);
	text-align: start;
}
.k-table th button:focus-visible {
	outline-offset: -2px;
}

/* Table Header */
.k-table thead th:first-child {
	border-start-start-radius: var(--rounded);
}
.k-table thead th:last-child {
	border-start-end-radius: var(--rounded);
}

/* Sticky Header */
.k-table thead th {
	position: sticky;
	top: var(--header-sticky-offset);
	inset-inline: 0;
	z-index: 1;
}

/* Table Body */
.k-table tbody tr:hover td {
	background: var(--table-color-hover);
}

/* Header cells in the body */
.k-table tbody th {
	width: auto;
	white-space: nowrap;
	overflow: visible;
	border-radius: 0;
}
.k-table tbody tr:first-child th {
	border-start-start-radius: var(--rounded);
}
.k-table tbody tr:last-child th {
	border-end-start-radius: var(--rounded);
	border-block-end: 0;
}

/* Sortable tables */
.k-table-row-ghost {
	background: var(--color-white);
	outline: var(--outline);
	border-radius: var(--rounded);
	margin-bottom: 2px;
	cursor: grabbing;
}
.k-table-row-fallback {
	opacity: 0 !important;
}

/* Table Index */
.k-table .k-table-index-column {
	width: var(--table-row-height);
	text-align: center;
}
.k-table .k-table-index {
	font-size: var(--text-xs);
	color: var(--color-text-dimmed);
	line-height: 1.1em;
}

/* Table Index with sort handle */
.k-table .k-table-index-column .k-sort-handle {
	--button-width: 100%;
	display: none;
}
.k-table tr:hover .k-table-index-column[data-sortable="true"] .k-table-index {
	display: none;
}
.k-table tr:hover .k-table-index-column[data-sortable="true"] .k-sort-handle {
	display: flex;
}

/* Table Options */
.k-table .k-table-options-column {
	padding: 0;
	width: var(--table-row-height);
	text-align: center;
}
.k-table .k-table-options-column .k-options-dropdown-toggle {
	--button-width: 100%;
	--button-height: 100%;
	outline-offset: -2px;
}

/* Empty */
.k-table-empty {
	color: var(--color-text-dimmed);
	font-size: var(--text-sm);
}

/* Disabled */
.k-table[aria-disabled="true"] {
	--table-color-back: transparent;
	--table-color-border: var(--color-border);
	--table-color-hover: transparent;
	--table-color-th-back: transparent;
	border: 1px solid var(--table-color-border);
	box-shadow: none;
}
.k-table[aria-disabled="true"] thead th {
	position: static;
}

/* Mobile */
@container (max-width: 40rem) {
	.k-table {
		overflow-x: scroll;
	}
	.k-table thead th {
		position: static;
	}
}

/* Pagination */
.k-table-pagination {
	border-top: 1px solid var(--table-color-border);
	height: var(--table-row-height);
	background: var(--table-color-th-back);
	display: flex;
	justify-content: center;
	border-end-start-radius: var(--rounded);
	border-end-end-radius: var(--rounded);
}
.k-table-pagination > .k-button {
	--button-color-back: transparent;
	border-left: 0 !important;
}
</style>
