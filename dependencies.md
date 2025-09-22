# Dependencies

This document is to note the reasons for needing the dependencies we have.

## nanostores and @nanostores/react

Used in the sidebar code, nanostores is a small framework-agnostic library for reactive state management, while the associated react package provides a hook for optimised component rendering on state changes. react-redux had some stale state issues when used alongside the native `<dialog>` element, causing it to not render with the correct state.
