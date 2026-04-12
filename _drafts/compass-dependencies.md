One of the projects I remember best from my time at Epic was fixing the performance of the Clarity Upgrade's dependency system.

The original Clarity Console model had no dependencies between any objects. There were only tables, and each table was extracted from Caché independently via its own KB_SQL query. You could upgrade them in any order; as long as they all got done before reports ran, it was fine.

It became necessary to create a dependencies system because we added new types of objects: views and derived tables. These are close to the same thing: a derived table is essentially a materialized view, that is, a table whose contents comes from a SQL query that populates it based on the contents of other tables. These objects contain a corresponding SQL query, which references other tables. The tables that are references need to be upgraded before the objects that reference them. This required us to sequence the upgrade according to dependency relations, and to do this we need a step in the upgrade process that calculated all of the dependencies.

The dependency system was originally written by Matt Hansen. I don't recall hearing much about the project until it was complete -- either I never attended a design meeting, or else I didn't pay enough attention at the time. Either way, I didn't engage much with the project until it was already essentially complete and landed in my queue for PQA. I reviewed, verified that it worked and passed it on to QA. I don't think I engaged very deeply with the design, since it was already complete; it was done, it worked, so I signed off on it.

At first, things went fine. However, after the introduction of the new object types, application developers began to create more and more views and derived tables. Soon, it became apparent that the dependency calculation was getting very slow. Perhaps a year later, the upgrade had gotten so slow that it was untenable.

Revisiting the way that dependency calculations were done, it was evident what the problem was. The code was traversing every object's entire dependency tree. For some dependency topologies this might have been fine, but for ours it was a mess. There were a few very big derived tables that had a large number of dependencies (I think the largest one was patient encounters), and those big derived tables in turn had a lot of tables depending on them. This meant that the big tables' large dependency trees got traversed over and over again.

I'm not sure what the complexity of this operation was, but for comparison, if you had a collection of tables where you arranged them in a sequence where each table depended on the table after it (like a linked list of tables), then you would get the following runtimes, where n is the number of tables and t is the number of table nodes traversed.

| n | 1 | 2 | 3 |  4 |  5 |  6 |
| t | 1 | 3 | 6 | 10 | 15 | 21 |

These are the [triangular numbers](https://artofproblemsolving.com/wiki/index.php?title=Triangular_number), which can be summed with the formula n(n+1)/2. This works out to time complexity O(n^2^). We needed to get it closer to O(n) in order to make it work.

To achieve this improvement, what we wanted was for the code to traverse each portion of the dependency tree only once. The obvious way to achieve this is a space-time tradeoff where we cache the results of the dependency walk for each table.
