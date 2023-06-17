import { set, del } from "vue";
import { length } from "@/helpers/object";
import Search from "@/mixins/search.js";

export default {
	mixins: [Search],
	data() {
		return {
			models: [],
			issue: null,
			selected: {},
			options: {
				endpoint: null,
				max: null,
				multiple: true,
				parent: null,
				selected: []
			},
			pagination: {
				limit: 20,
				page: 1,
				total: 0
			}
		};
	},
	computed: {
		collection() {
			return {
				empty: this.emptyProps,
				items: this.items,
				link: false,
				layout: "list",
				pagination: {
					details: true,
					dropdown: false,
					align: "center",
					...this.pagination
				},
				sortable: false
			};
		},
		items() {
			return this.models.map(this.item);
		}
	},
	methods: {
		async fetch() {
			const params = {
				page: this.pagination.page,
				search: this.query,
				...(this.fetchParams || {})
			};

			try {
				const response = await this.$api.get(this.options.endpoint, params);
				this.models = response.data;
				this.pagination = response.pagination;

				if (this.onFetched) {
					this.onFetched(response);
				}
			} catch (e) {
				this.$panel.error(e, false);
				this.models = [];
				this.issue = e.message;
			}
		},
		isSelected(item) {
			return this.selected[item.id] !== undefined;
		},
		item(item) {
			return item;
		},
		async open(models, options) {
			// reset pagination
			this.pagination.page = 0;

			// reset the search query
			this.query = null;

			let fetch = true;

			if (Array.isArray(models)) {
				this.models = models;
				fetch = false;
			} else {
				this.models = [];
				options = models;
			}

			this.options = {
				...this.options,
				...options
			};

			this.selected = {};

			this.options.selected.forEach((id) => {
				set(this.selected, id, { id });
			});

			if (fetch) {
				await this.fetch();
			}

			this.$refs.dialog.open();
		},
		paginate(pagination) {
			this.pagination.page = pagination.page;
			this.pagination.limit = pagination.limit;
			this.fetch();
		},
		submit() {
			this.$emit("submit", Object.values(this.selected));
			this.$refs.dialog.close();
		},
		async search() {
			this.pagination.page = 0;
			await this.fetch();
		},
		toggle(item) {
			if (this.options.multiple === false || this.options.max === 1) {
				this.selected = {};
			}

			if (this.isSelected(item)) {
				return del(this.selected, item.id);
			}

			if (this.options.max && this.options.max <= length(this.selected)) {
				return;
			}

			set(this.selected, item.id, item);
		},
		toggleBtn(item) {
			if (this.isSelected(item)) {
				return {
					icon:
						this.options.multiple === true && this.options.max !== 1
							? "check"
							: "circle-filled",
					title: this.$t("remove"),
					theme: "info"
				};
			}
			return {
				icon: "circle-outline",
				title: this.$t("select")
			};
		}
	}
};
