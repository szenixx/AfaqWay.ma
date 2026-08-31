# Permanent Security Rules — Apply to Every Future Change

## 🚨 MANDATORY RULE

These security rules apply to **EVERY change made to this project from now on**.

Security is not a one-time audit.

Whenever you:

* Add a feature
* Modify a feature
* Fix a bug
* Create an API
* Modify an API
* Change database logic
* Add a database table
* Modify database policies
* Add authentication functionality
* Modify authorization
* Change frontend components
* Change backend logic
* Add file uploads
* Add integrations
* Add admin functionality
* Change user permissions
* Install a dependency
* Modify environment variables
* Change deployment configuration

you MUST automatically consider the security implications.

Do not wait for the developer to explicitly ask for a security review.

---

# 1. SECURITY MUST BE PART OF EVERY CHANGE

Before implementing any change, ask yourself internally:

```text
Does this introduce a new security boundary?
Does this expose new data?
Does this introduce a new API endpoint?
Does this change authorization?
Does this change authentication?
Does this accept user input?
Does this interact with the database?
Does this handle files?
Does this expose secrets?
Does this change permissions?
Could a malicious user abuse this feature?
Could one user access another user's data?
Could a normal user gain admin privileges?
Could this create XSS, CSRF, SQL injection, SSRF, IDOR/BOLA, or another vulnerability?
```

If the answer is potentially yes, address the security requirement as part of the implementation.

---

# 2. NEVER TRUST CLIENT-SIDE SECURITY

The frontend is NOT a security boundary.

Never rely solely on:

```text
Hidden buttons
Disabled buttons
React state
Frontend validation
Client-side role checks
Hidden routes
UI restrictions
Obfuscated JavaScript
```

The server/backend must enforce security.

For every protected operation verify:

```text
Authentication
+
Authorization
+
Resource ownership
+
Input validation
+
Business rules
```

---

# 3. EVERY NEW API MUST BE SECURE BY DEFAULT

Whenever creating or modifying an API endpoint, automatically determine:

```text
Who can call it?
What authentication is required?
What role/permission is required?
What resource can they access?
What input is accepted?
What validation is required?
What data can be returned?
Should rate limiting apply?
Could the endpoint expose another user's data?
```

Never create an API endpoint that is accidentally public.

Never assume that because a frontend page is protected, its API is protected.

---

# 4. EVERY DATABASE OPERATION MUST CHECK AUTHORIZATION

Whenever adding or modifying database operations:

Verify that the requester has permission to:

```text
SELECT
INSERT
UPDATE
DELETE
```

the specific data involved.

Never rely on:

```text
userId from the browser
accountId from the browser
organizationId from the browser
role from the browser
isAdmin from the browser
```

without server-side verification.

If Row Level Security or equivalent database policies exist, maintain them correctly.

---

# 5. NEW FEATURES MUST NOT CREATE DATA LEAKS

Whenever a feature returns data to the frontend, ask:

> Does this response contain information the current user should not see?

Return only the minimum required information.

Do not unnecessarily expose:

```text
Internal IDs
Private user information
Database fields
Authentication information
Internal configuration
Admin information
Secrets
Internal system details
```

---

# 6. USER INPUT IS ALWAYS UNTRUSTED

Every new input must be treated as potentially malicious.

This includes:

```text
Text
Email
Names
IDs
URLs
Files
Query parameters
Form data
JSON
Headers
Cookies
Uploaded documents
Search terms
Rich text
Markdown
```

Validate and sanitize input on the server where appropriate.

Never assume frontend validation is sufficient.

---

# 7. EVERY NEW FEATURE MUST CONSIDER XSS

Whenever user-controlled content is displayed, check for XSS.

Be especially careful with:

```text
HTML
Markdown
Rich text
User profiles
Comments
Messages
Descriptions
URLs
Imported content
```

Avoid unsafe HTML rendering unless content is properly sanitized.

---

# 8. EVERY NEW FILE UPLOAD MUST BE SECURE

Whenever implementing file uploads, automatically consider:

```text
File size
File type
MIME type
Extension
Filename
Storage permissions
Public/private access
Executable files
SVG/HTML
Path traversal
Malicious content
Access control
```

Never trust the file extension or MIME type supplied by the client.

---

# 9. EVERY NEW SECRET MUST REMAIN SERVER-SIDE

Never place private credentials in:

```text
React components
Frontend JavaScript
Public configuration
HTML
Client-side environment variables
Git
Logs
API responses
```

Use the application's existing secure environment-variable mechanism.

If a secret is accidentally exposed, report it immediately.

---

# 10. ADMIN FUNCTIONALITY REQUIRES EXTRA SECURITY

Whenever modifying admin functionality:

Verify:

```text
Authentication
Admin authorization
Role integrity
Permission checks
Resource ownership
Audit logging where appropriate
```

A normal user must never be able to become an administrator by modifying a request.

Never trust:

```text
role: "admin"
isAdmin: true
```

from the client.

---

# 11. SECURITY MUST NOT DEGRADE PERFORMANCE

Security checks should be implemented efficiently.

Avoid unnecessary:

```text
Database queries
Repeated authorization queries
Network requests
Heavy processing
Blocking operations
Large logs
Repeated validation
```

Prefer efficient server-side authorization patterns.

If a security feature causes a performance regression, optimize the implementation rather than removing the security protection.

---

# 12. SECURITY MUST NOT BREAK EXISTING FUNCTIONALITY

Every security change must preserve existing behavior wherever possible.

Before modifying an existing feature:

Understand:

```text
Frontend behavior
Backend behavior
API contract
Database behavior
Authentication flow
Authorization flow
External integrations
```

After modifying it, verify that legitimate users can still perform the operation.

---

# 13. NEVER "FIX" SECURITY BY REMOVING FUNCTIONALITY

Do NOT solve a security problem by simply:

```text
Removing the feature
Removing the API
Removing the database operation
Disabling authentication
Disabling authorization
Making everything public
Removing validation
Disabling security checks
```

Find a proper secure implementation.

If a proper fix requires architectural changes, explain the situation before making a major rewrite.

---

# 14. DEPENDENCIES

Whenever adding a dependency:

Check:

```text
Purpose
Security reputation
Known vulnerabilities
Maintenance status
Compatibility
Bundle size
Performance impact
```

Do not add a package when the existing project can safely solve the problem without it.

Do not perform unnecessary dependency upgrades.

---

# 15. ENVIRONMENT AND DEPLOYMENT

Whenever changing deployment or configuration:

Check:

```text
HTTPS
Environment variables
Secrets
CORS
Security headers
Production/debug mode
Database exposure
Cloud permissions
Public endpoints
Logging
```

Never enable development/debug behavior in production accidentally.

---

# 16. ERROR MESSAGES

New errors must not expose sensitive internal information.

Never return:

```text
Passwords
Tokens
API keys
Database credentials
Stack traces
Internal filesystem paths
SQL queries
Environment variables
```

to normal users.

Keep useful debugging information server-side where appropriate.

---

# 17. LOGGING

Whenever adding logs, verify that they do not contain:

```text
Passwords
Tokens
API keys
Session IDs
Private user data
Sensitive documents
Authentication secrets
```

Security-relevant actions may be logged safely when appropriate.

---

# 18. RATE LIMITING

Whenever adding an endpoint involving:

```text
Login
Signup
Password reset
Email verification
Messages
Uploads
Expensive operations
Public APIs
Authentication
```

consider whether rate limiting is required.

Do not create limits so aggressive that legitimate users cannot use the application.

---

# 19. SECURITY HEADERS

Do not remove existing security headers.

When changing frontend/backend configuration, verify that important security headers remain functional.

Do not blindly add configurations that break:

```text
Scripts
Fonts
Images
APIs
WebSockets
Authentication
External integrations
```

---

# 20. BUSINESS LOGIC SECURITY

For every new feature, consider abuse cases.

Ask:

```text
Can a user bypass a required step?
Can a user modify a price?
Can a user access another user's resource?
Can a user perform an action multiple times?
Can a user skip authorization?
Can a user manipulate IDs?
Can a user modify hidden fields?
Can a user gain permissions?
Can an expired action be reused?
```

Security includes protecting business logic, not just preventing technical attacks.

---

# 21. BUG FIXES MUST ALSO BE SECURITY-AWARE

Even when fixing an unrelated bug, do not introduce a security regression.

For example:

If fixing:

```text
A loading problem
A notification bug
A UI issue
A database error
An API error
A navigation problem
```

do not bypass authorization, validation, authentication, or security checks just to make the bug disappear.

---

# 22. FRONTEND CHANGES

For frontend-only changes:

Do not unnecessarily modify security-sensitive logic.

If frontend code communicates with protected APIs, verify that the backend remains responsible for authorization.

Never move sensitive backend logic into the frontend simply because it is easier.

---

# 23. BACKEND CHANGES

For backend changes:

Always verify:

```text
Authentication
Authorization
Input validation
Data access
Error handling
Rate limiting where appropriate
Logging
Performance
```

before considering the implementation complete.

---

# 24. DATABASE CHANGES

For database changes:

Before changing schema or policies:

Understand:

```text
Existing users
Existing queries
Existing API behavior
Existing RLS/access policies
Existing relationships
Existing migrations
```

Do not perform destructive changes unless explicitly authorized.

Do not weaken database security to make an application query work.

---

# 25. BEFORE FINISHING ANY TASK

Every implementation must pass this mental checklist:

```text
[ ] Authentication still works
[ ] Authorization still works
[ ] Users cannot access unauthorized resources
[ ] Admin permissions remain protected
[ ] Client input is not blindly trusted
[ ] Database access is protected
[ ] No secrets are exposed
[ ] No obvious XSS introduced
[ ] No obvious injection vulnerability introduced
[ ] No unnecessary API exposure
[ ] No unnecessary data exposure
[ ] Existing functionality still works
[ ] Frontend behavior is preserved
[ ] Backend behavior is preserved
[ ] Performance is not unnecessarily degraded
[ ] Existing tests still pass
[ ] Build still passes
```

---

# 26. SECURITY REGRESSION CHECK

Before declaring a task complete:

Compare the security posture before and after the change.

Ask:

> "Did this change make any existing security boundary weaker?"

If yes, fix it before finishing.

---

# 27. WHEN IN DOUBT

If there is a conflict between:

```text
Convenience
vs
Security
```

prefer the secure implementation.

If there is a conflict between:

```text
Security
vs
Existing functionality
```

do not blindly choose one.

Find a solution that preserves both.

If that is impossible without a significant architectural change, explain the trade-off before making the change.

---

# 28. PERMANENT PROJECT RULE

These rules are **permanent project requirements**.

They apply to:

> **Every current and future change made by Claude Code.**

Do not require the developer to repeat these instructions every time.

Whenever you work on this project, automatically apply these security principles.

Security must be treated as part of the normal development process:

```text
Plan
↓
Implement
↓
Security review
↓
Test
↓
Performance check
↓
Regression check
↓
Complete
```

The goal is not merely:

> "Make the current platform secure."

The goal is:

> **Keep the platform secure as it evolves.**

Every new feature should be secure by design rather than secured afterward.
