<template>
  <div class="flex min-h-screen flex-col">
    <a href="#main-content" class="skip-link">Aller au contenu principal</a>
    <CommonAppHeader />
    <main id="main-content" tabindex="-1" class="flex-1 focus:outline-none">
      <slot />
    </main>
    <CommonAppFooter />
  </div>
</template>
