# Cookie integration boundary

The frontend demo intentionally does not manage authentication cookies. Production sign-in and HttpOnly/Secure/SameSite cookie setting must be implemented by the Django/API deployment boundary with a documented CSRF strategy.
