package org.apache.nifi.registry.web.syncfusionutilities;

import java.security.InvalidAlgorithmParameterException;
import java.security.InvalidKeyException;
import java.security.Key;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import javax.crypto.BadPaddingException;
import javax.crypto.Cipher;
import javax.crypto.IllegalBlockSizeException;
import javax.crypto.NoSuchPaddingException;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;

public class UMSCipher {

    private final byte[] initVectorBytes = {83, 41, -111, 78, 53, 109, -28, 73, -83, -114, 47, 11, 90, 58, 62, -38};
    private final byte[] KeyBytes = {63, 41, -47, 110, -109, 67, 105, 34, 63, 99, -114, -101, -5, 95, -118, 41};

    public String encrypt(String plainText) throws NoSuchAlgorithmException, NoSuchPaddingException, InvalidKeyException, InvalidAlgorithmParameterException, IllegalBlockSizeException, BadPaddingException {
        if (plainText == null || plainText.equals("")) {
            return "";
        }
        Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5PADDING");

        IvParameterSpec ivspec = new IvParameterSpec(initVectorBytes);

        Key SecretKey = new SecretKeySpec(KeyBytes, "AES");
        cipher.init(Cipher.ENCRYPT_MODE, SecretKey, ivspec);

        return new String(Base64.getEncoder().encode(cipher.doFinal(plainText.getBytes())));

    }

    public String decrypt(String encryptedText) throws NoSuchAlgorithmException, NoSuchPaddingException, InvalidKeyException, InvalidAlgorithmParameterException, IllegalBlockSizeException, BadPaddingException {
        Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5PADDING");

        IvParameterSpec ivspec = new IvParameterSpec(initVectorBytes);

        Key SecretKey = new SecretKeySpec(KeyBytes, "AES");
        cipher.init(Cipher.DECRYPT_MODE, SecretKey, ivspec);

        byte DecodedMessage[] = Base64.getDecoder().decode(encryptedText);
        return new String(cipher.doFinal(DecodedMessage));
    }
}
