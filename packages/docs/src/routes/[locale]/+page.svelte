<script lang="ts">
	import i18n from '../../server/i18n';

	// get it in the locale lang

	const scope = i18n.getSubI18n({
		locale: 'en'
	});

	// scope.
</script>

{#await scope.loadTranslation('default')}
	Loading...
{:then d}
	<h2>{scope.t('default:hello')}</h2>
{/await}

<div />

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>

<div>Index page</div>
