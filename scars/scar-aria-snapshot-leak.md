# Accessibility snapshot prints form field value

After a script filled a form with a secret, an accessibility snapshot of the page was taken to verify the input. The snapshot included the current value of the text box, leaking the secret into the session log. The rule is to filter out values of secret fields from UI snapshots or verify input using non-visual methods.
