export const checkLoginStatus = () => {
  return localStorage.getItem('isLoggedIn') === 'true';
};

export const redirectToLogin = () => {
  window.location.href = '/login';
};

export const redirectToChatranka = () => {
  window.location.href = '/chatranka';
};