
# Project Cutie

Project Cutie is an implementation of the QTIv3 standard for displaying and scoring QTI Assessment Items.

## QTI Documentation
- https://www.imsglobal.org/spec/qti/v3p0/impl

## Design

Response and template processing are separated from the presentational layer using purely stateless and asynchronous functions. This allows item definitions to be processed securely in a backend environment without exposing sensitive content to the client.

### Architecture

**Server-side (cutie-core):**
- **Template processing**: Takes item definition and current state, produces sanitized QTI XML
  - Resolves template variables to their current values
  - Applies conditional visibility based on state
  - Strips sensitive content (response processing rules, correct answers, hidden feedback, variable declarations)
  - Returns presentation-ready QTI XML safe for client consumption
- **Response processing**: A reducer function that accepts current state, item definition, and response submission, then produces a new state

**Client-side (cutie-client):**
- Parses sanitized QTI XML from server
- Converts QTI XML to HTML for rendering
- Wires up interaction handlers (drag/drop, drawing, hotspots, etc.)
- Serializes user responses back to QTI format for submission

**Learner state**: A serializable `AttemptState` object representing a learner's attempt at an item, containing:
- Opaque `variables` object managed by QTI processing (host application doesn't interpret)
- Standardized `completionStatus` field indicating if further attempts are allowed

### Benefits

- **Platform flexibility**: XML intermediate format enables alternative renderers (native mobile apps, PDF generation, accessibility tools)
- **Security**: Server acts as content filter, never exposing sensitive item data
- **Separation of concerns**: Server handles QTI logic, client handles presentation
- **Testability**: Easy to verify server output is valid, sanitized QTI XML
