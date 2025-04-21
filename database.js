const Database = require('better-sqlite3');

class DatabaseManager {
    constructor() {
        this.db = new Database('suggestions.db');
        this.initializeDatabase();
    }

    initializeDatabase() {
        // Create suggestions table if it doesn't exist
        this.db.prepare(`
            CREATE TABLE IF NOT EXISTS suggestions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id TEXT NOT NULL,
                message_id TEXT NOT NULL,
                channel_id TEXT NOT NULL,
                author_id TEXT NOT NULL,
                category TEXT NOT NULL,
                content TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                upvotes INTEGER DEFAULT 0,
                downvotes INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `).run();

        // Create user_votes table to track individual votes
        this.db.prepare(`
            CREATE TABLE IF NOT EXISTS user_votes (
                suggestion_id INTEGER,
                user_id TEXT NOT NULL,
                vote_type TEXT NOT NULL,
                FOREIGN KEY (suggestion_id) REFERENCES suggestions(id),
                PRIMARY KEY (suggestion_id, user_id)
            )
        `).run();
    }

    addSuggestion(guildId, messageId, channelId, authorId, category, content) {
        const stmt = this.db.prepare(`
            INSERT INTO suggestions (guild_id, message_id, channel_id, author_id, category, content)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        return stmt.run(guildId, messageId, channelId, authorId, category, content);
    }

    updateSuggestionStatus(messageId, status) {
        const stmt = this.db.prepare(`
            UPDATE suggestions
            SET status = ?
            WHERE message_id = ?
        `);
        return stmt.run(status, messageId);
    }

    updateVotes(messageId, upvotes, downvotes) {
        const stmt = this.db.prepare(`
            UPDATE suggestions
            SET upvotes = ?, downvotes = ?
            WHERE message_id = ?
        `);
        return stmt.run(upvotes, downvotes, messageId);
    }

    getUserVote(suggestionId, userId) {
        const stmt = this.db.prepare(`
            SELECT vote_type FROM user_votes
            WHERE suggestion_id = ? AND user_id = ?
        `);
        return stmt.get(suggestionId, userId);
    }

    setUserVote(suggestionId, userId, voteType) {
        const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO user_votes (suggestion_id, user_id, vote_type)
            VALUES (?, ?, ?)
        `);
        return stmt.run(suggestionId, userId, voteType);
    }

    removeUserVote(suggestionId, userId) {
        const stmt = this.db.prepare(`
            DELETE FROM user_votes
            WHERE suggestion_id = ? AND user_id = ?
        `);
        return stmt.run(suggestionId, userId);
    }

    getSuggestionByMessageId(messageId) {
        const stmt = this.db.prepare(`
            SELECT * FROM suggestions
            WHERE message_id = ?
        `);
        return stmt.get(messageId);
    }

    getGuildSuggestions(guildId, status = null) {
        let query = `
            SELECT * FROM suggestions
            WHERE guild_id = ?
        `;
        const params = [guildId];

        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }

        query += ' ORDER BY created_at DESC';

        const stmt = this.db.prepare(query);
        return stmt.all(...params);
    }

    getSuggestionStats(guildId) {
        const stmt = this.db.prepare(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
                SUM(CASE WHEN status = 'denied' THEN 1 ELSE 0 END) as denied
            FROM suggestions
            WHERE guild_id = ?
        `);
        return stmt.get(guildId);
    }
}

module.exports = new DatabaseManager(); 