DROP SCHEMA IF EXISTS dissys;
CREATE SCHEMA dissys;

USE dissys;

CREATE TABLE transaction_record(
    record_id INTEGER NOT NULL,
    executedTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, 
    CONSTRAINT transaction_record PRIMARY KEY (record_id)
);

CREATE TABLE user_record(
    username VARCHAR(30) NOT NULL,
    CONSTRAINT PRIMARY KEY (username)
);

CREATE TABLE group_record(
    group_id VARCHAR(30) NOT NULL,
    CONSTRAINT PRIMARY KEY (group_id)
);

CREATE TABLE user_join_group(
    username VARCHAR(30) NOT NULL,
    group_id VARCHAR(30) NOT NULL,
    CONSTRAINT PRIMARY KEY (username,group_id),
    CONSTRAINT FOREIGN KEY (username) REFERENCES user_record(username),
    CONSTRAINT FOREIGN KEY (group_id) REFERENCES group_record(group_id)
);

CREATE TABLE message_record(
    message_id INTEGER NOT NULL,
    group_id VARCHAR(30) NOT NULL,
    message_text TEXT NOT NULL,
    message_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT PRIMARY KEY (message_id,group_id),
    CONSTRAINT FOREIGN KEY (group_id) REFERENCES group_record(group_id)
);