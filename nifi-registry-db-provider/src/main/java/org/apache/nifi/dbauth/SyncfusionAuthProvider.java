
package org.apache.nifi.dbauth;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class SyncfusionAuthProvider {
    
    private static final Logger logger = LoggerFactory.getLogger(DbProvider.class);
    private Connection con = null;
    private Statement stmt = null;
    
    public SyncfusionAuthProvider(DbTypes dbType, String dbUrl) 
            throws Exception {
        this(dbType, dbUrl, null, null);
    }
    
    public SyncfusionAuthProvider(DbTypes dbType, String dbUrl, String username, String password) 
            throws Exception {
        String url;
        switch(dbType)
        {
            case Sqlite:
                Class.forName("org.sqlite.JDBC");
                url = "jdbc:sqlite:" + dbUrl;
                break;
            case PostgreSQL:
                Class.forName("org.postgresql.Driver");
                url = "jdbc:postgresql://" + dbUrl;
                break;
            default:
                throw new Exception(dbType + " database not supported in this version.\"");
        }
        if(username != null && password != null)
            con = DriverManager.getConnection(url, username, password);
        else
            con = DriverManager.getConnection(url);
        stmt = con.createStatement();
    }
    
    public Boolean isAuthenticatedUser(String username, String password) {
        try {
            String query = "select * from users where username='" + username + "'";
            ResultSet rs = stmt.executeQuery(query);
            if(rs.next())
            {
                String user = rs.getString("username");
                String pswd = rs.getString("password");
                if(username.equals(user) && password.equals(pswd))
                    return true;
            }
        }
        catch(SQLException ex) {
            if (logger.isDebugEnabled()) {
                logger.debug(StringUtils.EMPTY, ex);
            }
        }
        return false;
    }
    
    public void dispose() {
        try {
            stmt.close();
            con.close();
        } catch (SQLException ex) {
            if (logger.isDebugEnabled()) {
                logger.debug(StringUtils.EMPTY, ex);
            }
        }
    }
}
