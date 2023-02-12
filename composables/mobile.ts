export function useOnMobile() {
  const mobile = ref(false);
  onMounted(() => {
    function onResize() {
      mobile.value = window.innerWidth < 600;
    }

    onResize();
    window.onresize = onResize;
  });

  return mobile;
}
