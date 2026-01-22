
# Project Cutie

Project Cutie is an implementation of the QTIv3 standard for displaying and scoring QTI Assessment Items.

## QTI Documentation
- https://www.imsglobal.org/spec/qti/v3p0/impl

## Design

Response and Template processing is removed from the presentational layer in purely stateless and asynchronous functions, this allows item definitions to be processed securely in a backend environment without ever being exposed to the interface. The Template processing produces html snippets that can be rendered in the front end.

A learner's "attempt" at an item has "state" which is a serializable object. Response processing is a reducer that accepts the current state, the item definition, the response submission, and produces a new state. Template processing accepts the item definition and the current state, and produces the html snippet to be rendered.
