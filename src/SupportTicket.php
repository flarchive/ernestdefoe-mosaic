<?php

/*
 * This file is part of ernestdefoe/mosaic.
 *
 * Copyright (c) Ernest Defoe.
 *
 * For the full copyright and license information, please view the LICENSE file
 * that was distributed with this source code.
 */

namespace Ernestdefoe\Mosaic;

use Flarum\Database\AbstractModel;
use Illuminate\Database\Eloquent\Builder;

/**
 * Lightweight read-model for the optional linkrobins/support tickets table.
 *
 * The table name is resolved at runtime (the canonical
 * `linkrobins_support_tickets`, or the legacy `support_tickets`) and bound
 * with queryTable(), so AddForumStatistics can count resolved tickets through
 * Eloquent instead of borrowing a raw ConnectionInterface and calling
 * ->table() on it.
 */
class SupportTicket extends AbstractModel
{
    public $timestamps = false;

    /** A query builder bound to the given (runtime-resolved) table name. */
    public static function queryTable(string $table): Builder
    {
        $model = new self();
        $model->setTable($table);

        return $model->newQuery();
    }
}
