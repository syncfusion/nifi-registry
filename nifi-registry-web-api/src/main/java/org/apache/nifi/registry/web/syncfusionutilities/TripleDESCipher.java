
package org.apache.nifi.registry.web.syncfusionutilities;

import java.security.MessageDigest;
import java.util.Arrays;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;

public class TripleDESCipher {

    private static final String privateKey = "8gLcqIoXpAzUl";
    
    public String encrypt(String data) throws Exception {
        final MessageDigest msgDigest = MessageDigest.getInstance("md5");
        final byte[] digestOfPassword = msgDigest.digest(privateKey
                .getBytes("UTF-16LE"));
        final byte[] keyBytes = Arrays.copyOf(digestOfPassword, 24);
        for (int j = 0, k = 16; j < 8;) {
            keyBytes[k++] = keyBytes[j++];
        }
        final SecretKey secretKey = new SecretKeySpec(keyBytes, 0, 24, "DESede");
        final IvParameterSpec iv = new IvParameterSpec(new byte[8]);
        final Cipher cipher = Cipher.getInstance("DESede/CBC/PKCS5Padding");
        cipher.init(Cipher.ENCRYPT_MODE, secretKey, iv);
        final byte[] textBytes = data.getBytes("UTF-16LE");
        final byte[] cipherText = cipher.doFinal(textBytes);
        return new String(Base64.getEncoder().encode(cipherText));
    }

    public String decrypt(String data) throws Exception {
        final MessageDigest msgDigest = MessageDigest.getInstance("md5");
        final byte[] digestOfPassword = msgDigest.digest(privateKey
                .getBytes("UTF-16LE"));
        final byte[] keyBytes = Arrays.copyOf(digestOfPassword, 24);
        for (int j = 0, k = 16; j < 8;) {
            keyBytes[k++] = keyBytes[j++];
        }
        final SecretKey secretKey = new SecretKeySpec(keyBytes, 0, 24, "DESede");
        final IvParameterSpec iv = new IvParameterSpec(new byte[8]);
        final Cipher decipher = Cipher.getInstance("DESede/CBC/PKCS5Padding");
        decipher.init(Cipher.DECRYPT_MODE, secretKey, iv);
        final byte[] plainText = decipher.doFinal(Base64.getDecoder().decode(data));
        return new String(plainText, "UTF-16LE");
    }
    
   
}
