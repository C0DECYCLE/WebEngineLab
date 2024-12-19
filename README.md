# 🪶 WebEngine Lab

> Experimental lab for the lightweight fast graphics engine for the web.

## Notes

-   wrap/unwrap
-   simplify
-   bounding boxes
-   frustum culling
-   occlusing culling
-   compute shader
-   material system
-   per triangle or per vertex
-   improve clustering algorithm
-   merge chlusters based on original splitting

### Cluster

-   Max 128 verts (unique?, tris?)
-   Simplify if necessary
-   ClusterId
-   Boudning Info
-   Parent, children, sibling info

### Compiletime

-   Import mesh data
-   Parse mesh data
-   Wrap or unwrap?
-   Analyse mesh data
-   Subdivide and build tree
-   Complete binary tree out of clusters
-   Save in array format
-   Build all cluster attributes

### Runtime

-   Go through each entity
-   Get corresponding mesh tree
-   Cull by frustum, occlusion? and screen space
-   If cluster not culled dispach it to the draw buffer
-   Draw call draw buffer
