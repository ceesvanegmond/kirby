<template>
	<div data-theme="error" class="k-notification k-login-alert">
		<p><slot /></p>
		<k-button icon="cancel" @click="$emit('click')" />
	</div>
</template>
