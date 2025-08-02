# Docker Setup for Exulu Backend

This directory contains Docker configuration for running the various required infrastructure elements of the Exulu IMP.

Each service is split into its own compose file so you can flexibly mix and match which services run in a docker container, or if you wish to run certain parts directly or in a managed cloud (for example if you have a Postgres instance running somewhere else). For more information see the main readme file.