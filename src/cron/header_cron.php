<?php

$_SERVER[ 'HTTP_HOST' ] = '';

/**
 * Execution que cli
 */
if( php_sapi_name() !== 'cli' )
    exit;
