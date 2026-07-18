# Module boundaries

This directory reserves the top-level boundaries of the modular monolith. The
directories are documentation-only placeholders; no product capability is
implemented by them.

When implementation begins, each module must expose an explicit public API.
Consumers must not deep-import another module's internal files, reach into its
data layer, or rely on hidden cross-domain dependencies. Cross-module work must
use documented contracts, and dependency cycles are forbidden.

The precise responsibilities and contracts remain subject to the complete
product concept and a task with explicit acceptance criteria.
