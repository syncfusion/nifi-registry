package org.apache.nifi.registry.web.syncfusionutilities;

import java.security.KeyManagementException;
import java.security.NoSuchAlgorithmException;
import java.security.cert.X509Certificate;
import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSession;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;

public final class TrustAllCertificates implements X509TrustManager, HostnameVerifier
{

    /**
     *
     * @return
     */
    @Override
    public X509Certificate[] getAcceptedIssuers() {return null;}

    /**
     *
     * @param certs
     * @param authType
     */
    @Override
    public void checkClientTrusted(X509Certificate[] certs, String authType) {}

    /**
     *
     * @param certs
     * @param authType
     */
    @Override
    public void checkServerTrusted(X509Certificate[] certs, String authType) {}

    /**
     *
     * @param hostname
     * @param session
     * @return
     */
    @Override
    public boolean verify(String hostname, SSLSession session) {return true;}
    
    public static void install()
    {
        try
        {
            TrustAllCertificates trustAll = new TrustAllCertificates();
            SSLContext sc = SSLContext.getInstance("SSL");
            sc.init(null, 
                    new TrustManager[]{trustAll}, 
                    new java.security.SecureRandom());          
            HttpsURLConnection.setDefaultSSLSocketFactory(sc.getSocketFactory());
            HttpsURLConnection.setDefaultHostnameVerifier(trustAll);
        }
        catch (NoSuchAlgorithmException | KeyManagementException e)
        {
            throw new RuntimeException("Failed setting up all thrusting certificate manager.", e);
        }
    }
}
