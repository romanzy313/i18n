<script lang="ts">
  //

  import i18n from "./i18n-svelte";
  let count = 0;
</script>

{#await i18n.loadTranslation("app")}
  Loading...
{:then}
  <div>
    <div>
      {i18n.t("app:counter", {
        count,
      })}
    </div>
    <button
      on:click={() => {
        if (count > 0) count--;
      }}
      disabled={count <= 0}>-</button
    >
    <button
      on:click={() => {
        count++;
      }}>+</button
    >
  </div>
{/await}
