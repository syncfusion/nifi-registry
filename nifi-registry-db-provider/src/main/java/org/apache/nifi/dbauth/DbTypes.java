
package org.apache.nifi.dbauth;

public enum DbTypes {
    Sqlite("sqlite"),
    PostgreSQL("postgresql");
    
    private final String type;
    
    private DbTypes(final String type) {
        this.type = type;
    }
    
    @Override
    public String toString() {
        return type;
    }
}
