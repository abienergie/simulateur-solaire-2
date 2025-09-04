export function scrollToTop(behavior: ScrollBehavior = 'smooth') {
  window.scrollTo({
    top: 0,
    behavior
  });
}