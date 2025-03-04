<template>
	<span :data-disabled="disabled" :data-empty="isEmpty" class="k-select-input">
		<select
			:id="id"
			ref="input"
			:autofocus="autofocus"
			:aria-label="ariaLabel"
			:disabled="disabled"
			:name="name"
			:required="required"
			:value="selected"
			class="k-select-input-native"
			v-on="listeners"
		>
			<option v-if="hasEmptyOption" :disabled="required" value="">
				{{ emptyOption }}
			</option>
			<option
				v-for="option in options"
				:key="option.value"
				:disabled="option.disabled"
				:value="option.value"
			>
				{{ option.text }}
			</option>
		</select>
		{{ label }}
	</span>
</template>

<script>
import Input, { props as InputProps } from "@/mixins/input.js";
import { options, placeholder } from "@/mixins/props.js";

import { required as validateRequired } from "vuelidate/lib/validators";

export const props = {
	mixins: [InputProps, options, placeholder],
	props: {
		ariaLabel: String,
		default: String,
		/**
		 * The text, that is shown as the first empty option, when the field is not required.
		 */
		empty: {
			type: [Boolean, String],
			default: true
		},
		value: {
			type: [String, Number, Boolean],
			default: ""
		}
	}
};

export default {
	mixins: [Input, props],
	data() {
		return {
			selected: this.value,
			listeners: {
				...this.$listeners,
				click: (event) => this.onClick(event),
				change: (event) => this.onInput(event.target.value),
				input: () => {}
			}
		};
	},
	computed: {
		emptyOption() {
			return this.placeholder ?? "—";
		},
		hasEmptyOption() {
			if (this.empty === false) {
				return false;
			}

			return !(this.required && this.default);
		},
		isEmpty() {
			return (
				this.selected === null ||
				this.selected === undefined ||
				this.selected === ""
			);
		},
		label() {
			const label = this.text(this.selected);

			if (this.selected === "" || this.selected === null || label === null) {
				return this.emptyOption;
			}

			return label;
		}
	},
	watch: {
		value(value) {
			this.selected = value;
			this.onInvalid();
		}
	},
	mounted() {
		this.onInvalid();

		if (this.$props.autofocus) {
			this.focus();
		}
	},
	methods: {
		focus() {
			this.$refs.input.focus();
		},
		onClick(event) {
			event.stopPropagation();
			this.$emit("click", event);
		},
		onInvalid() {
			this.$emit("invalid", this.$v.$invalid, this.$v);
		},
		onInput(value) {
			this.selected = value;
			this.$emit("input", this.selected);
		},
		select() {
			this.focus();
		},
		text(value) {
			let text = null;

			for (const option of this.options) {
				if (option.value == value) {
					text = option.text;
				}
			}

			return text;
		}
	},
	validations() {
		return {
			selected: {
				required: this.required ? validateRequired : true
			}
		};
	}
};
</script>

<style>
.k-select-input {
	position: relative;
	display: block;
	overflow: hidden;
	padding: var(--input-padding);
	border-radius: var(--input-rounded);
}
.k-select-input[data-empty="true"] {
	color: var(--input-color-placeholder);
}

.k-select-input-native {
	position: absolute;
	inset: 0;
	opacity: 0;
	z-index: 1;
}
.k-select-input-native[disabled] {
	cursor: default;
}

/* Input context */
.k-input[data-type="select"] {
	position: relative;
}
.k-input[data-type="select"] .k-input-icon {
	position: absolute;
	inset-block: 0;
	inset-inline-end: 0;
}
</style>
